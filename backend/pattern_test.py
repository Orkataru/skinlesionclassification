import requests
import time
import matplotlib.pyplot as plt
import numpy as np
import threading
import argparse
import platform
import os
from PIL import Image
import io
import json
from datetime import datetime

# Parse command line arguments
parser = argparse.ArgumentParser(description='Pattern testing for skin lesion classifier API')
parser.add_argument('--url', type=str, required=True, help='URL of the service')
parser.add_argument('--image', type=str, default='ISIC-images/ISIC_4117381.jpg', help='Path to test image')
parser.add_argument('--output', type=str, default='test_results', help='Output directory for results')
parser.add_argument('--burst_size', type=int, default=20, help='Number of concurrent requests in burst test')
parser.add_argument('--ramp_end', type=int, default=5, help='Peak requests per second for ramp test')
args = parser.parse_args()

# Load the test image
with open(args.image, 'rb') as f:
    image_data = f.read()

# Function to send a request and measure response time
def send_request(session=None):
    if session is None:
        session = requests.Session()
    
    start_time = time.time()
    files = {"file": ("image.jpg", image_data, "image/jpeg")}
    try:
        response = session.post(args.url, files=files)
        status_code = response.status_code
        if status_code == 200:
            response_data = response.json()
        else:
            response_data = response.text
    except Exception as e:
        status_code = 0
        response_data = str(e)
    
    duration = time.time() - start_time
    return {
        "status_code": status_code,
        "duration": duration,
        "timestamp": time.time(),
        "response": response_data
    }

# Test 1: Baseline - Single requests with pauses
def run_baseline_test(count=10, pause=1):
    print(f"Running baseline test: {count} sequential requests with {pause}s pauses...")
    session = requests.Session()
    results = []
    
    for i in range(count):
        result = send_request(session)
        results.append(result)
        print(f"Request {i+1}/{count}: {result['duration']:.3f}s, Status: {result['status_code']}")
        if i < count - 1:
            time.sleep(pause)
    
    return results

# Test 2: Burst Test - Sudden spike in traffic
def run_burst_test(burst_size=20):
    print(f"Running burst test: Sudden spike of {burst_size} concurrent requests...")
    threads = []
    results = []
    result_lock = threading.Lock()  # Thread-safe appending to results
    
    # Create a function for the threads to execute
    def thread_function():
        result = send_request()
        with result_lock:
            results.append(result)
    
    # Create and start threads
    for i in range(burst_size):
        thread = threading.Thread(target=thread_function)
        threads.append(thread)
        thread.start()
    
    # Wait for all threads to complete
    for thread in threads:
        thread.join()
    
    # Sort results by timestamp
    results.sort(key=lambda x: x["timestamp"])
    
    success_count = sum(1 for r in results if r["status_code"] == 200)
    print(f"Burst test complete. Success rate: {success_count}/{burst_size}")
    
    return results

# Test 3: Ramp-up Test - Gradually increasing load
def run_ramp_test(start_rps=1, end_rps=10, duration=60):
    print(f"Running ramp test: Gradually increasing from {start_rps} to {end_rps} req/sec over {duration} seconds...")
    
    start_time = time.time()
    end_time = start_time + duration
    results = []
    result_lock = threading.Lock()  # Thread-safe appending to results
    
    # Calculate time between requests for each second
    seconds = np.arange(duration)
    req_per_second = np.linspace(start_rps, end_rps, duration)
    
    # Create a schedule of when to send requests
    schedule = []
    for second, rps in zip(seconds, req_per_second):
        if rps < 1:
            if np.random.random() < rps:  # Probabilistic sending for fractional RPS
                schedule.append(start_time + second)
        else:
            # Distribute the requests evenly within the second
            for i in range(int(rps)):
                schedule.append(start_time + second + (i / rps))
    
    # Use threading to handle the scheduled requests
    def execute_scheduled_requests():
        i = 0
        while i < len(schedule):
            now = time.time()
            if now >= schedule[i]:
                result = send_request()
                with result_lock:
                    result["scheduled_time"] = schedule[i]
                    results.append(result)
                i += 1
            else:
                time.sleep(0.01)  # Small sleep to avoid burning CPU
    
    # Start the scheduler thread
    scheduler_thread = threading.Thread(target=execute_scheduled_requests)
    scheduler_thread.start()
    
    # Report progress periodically while the scheduler is running
    next_report = start_time + 5  # Report every 5 seconds
    while scheduler_thread.is_alive():
        now = time.time()
        if now >= next_report:
            elapsed = now - start_time
            with result_lock:
                completed = len(results)
            print(f"Ramp test progress: {elapsed:.1f}/{duration}s, sent {completed}/{len(schedule)} requests")
            next_report = now + 5
        time.sleep(0.5)  # Check progress every half second
    
    # Wait for scheduler to complete
    scheduler_thread.join()
    
    # Sort results by timestamp
    results.sort(key=lambda x: x["timestamp"])
    
    success_count = sum(1 for r in results if r["status_code"] == 200)
    print(f"Ramp test complete. Success rate: {success_count}/{len(results)}")
    
    return results

def main():
    # Create output directory if it doesn't exist
    if not os.path.exists(args.output):
        os.makedirs(args.output)
    
    # Generate timestamp for this test run
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    
    # Run tests
    print(f"Testing endpoint: {args.url}")
    print(f"Using image: {args.image}")
    print(f"Saving results to: {args.output}\n")
    
    baseline_results = run_baseline_test(count=10, pause=2)
    time.sleep(10)  # Wait for system to stabilize
    
    burst_results = run_burst_test(burst_size=args.burst_size)
    time.sleep(20)  # Longer wait after burst test
    
    ramp_results = run_ramp_test(start_rps=1, end_rps=args.ramp_end, duration=60)
    
    # Save results
    def save_results(results, name):
        with open(f"{args.output}/{timestamp}_{name}_results.json", "w") as f:
            json.dump([{k: v for k, v in r.items() if k != 'response'} for r in results], f, indent=2)
    
    save_results(baseline_results, "baseline")
    save_results(burst_results, "burst")
    save_results(ramp_results, "ramp")
    
    # Plot results
    plt.figure(figsize=(15, 10))
    
    # Plot 1: Response times for baseline test
    plt.subplot(3, 1, 1)
    times = [r["duration"] * 1000 for r in baseline_results]  # Convert to ms
    plt.plot(range(1, len(times) + 1), times, 'o-')
    plt.title("Baseline Test: Sequential Requests")
    plt.xlabel("Request #")
    plt.ylabel("Response Time (ms)")
    plt.grid(True)
    
    # Plot 2: Response times for burst test
    plt.subplot(3, 1, 2)
    times = [(r["timestamp"] - burst_results[0]["timestamp"]) for r in burst_results]
    durations = [r["duration"] * 1000 for r in burst_results]
    plt.scatter(times, durations)
    plt.title(f"Burst Test: {len(burst_results)} Concurrent Requests")
    plt.xlabel("Time from start (s)")
    plt.ylabel("Response Time (ms)")
    plt.grid(True)
    
    # Plot 3: Response times for ramp test
    plt.subplot(3, 1, 3)
    times = [(r["timestamp"] - ramp_results[0]["timestamp"]) for r in ramp_results]
    durations = [r["duration"] * 1000 for r in ramp_results]
    plt.scatter(times, durations)
    plt.title("Ramp Test: Gradually Increasing Load")
    plt.xlabel("Time from start (s)")
    plt.ylabel("Response Time (ms)")
    plt.grid(True)
    
    plt.tight_layout()
    plt.savefig(f"{args.output}/{timestamp}_test_results.png")
    print(f"Plots saved to {args.output}/{timestamp}_test_results.png")

if __name__ == "__main__":
    main()
