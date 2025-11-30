import requests
import time
import asyncio
import aiohttp
import os
import statistics
import argparse
import platform
import sys
from PIL import Image
import io
from concurrent.futures import ThreadPoolExecutor

# Fix for Windows asyncio issues
if platform.system() == 'Windows':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

# Parse command line arguments
parser = argparse.ArgumentParser(description='Load testing for skin lesion classifier API')
parser.add_argument('--url', type=str, required=True, help='URL of the service')
parser.add_argument('--concurrency', type=int, default=10, help='Number of concurrent requests')
parser.add_argument('--total', type=int, default=100, help='Total number of requests to send')
parser.add_argument('--image', type=str, default='ISIC-images/ISIC_4117381.jpg', help='Path to test image')
args = parser.parse_args()

# Load the test image
with open(args.image, 'rb') as f:
    image_data = f.read()

# Synchronous version for comparison
def send_request():
    start_time = time.time()
    files = {"file": ("image.jpg", image_data, "image/jpeg")}
    response = requests.post(args.url, files=files)
    duration = time.time() - start_time
    return {
        "status_code": response.status_code,
        "duration": duration,
        "response": response.json() if response.status_code == 200 else response.text
    }

# Asynchronous version for concurrent testing
async def send_async_request(session):
    start_time = time.time()
    data = aiohttp.FormData()
    data.add_field('file', image_data, filename='image.jpg', content_type='image/jpeg')
    
    try:
        async with session.post(args.url, data=data) as response:
            status_code = response.status
            if status_code == 200:
                response_data = await response.json()
            else:
                response_data = await response.text()
    except Exception as e:
        status_code = 0
        response_data = str(e)
    
    duration = time.time() - start_time
    return {
        "status_code": status_code,
        "duration": duration,
        "response": response_data
    }

# Run concurrent load test
async def run_load_test():
    print(f"Running single baseline test...")
    baseline = send_request()
    print(f"Baseline request: {baseline['duration']:.3f}s, Status: {baseline['status_code']}")
    
    print(f"Running load test with {args.concurrency} concurrent requests, {args.total} total requests...")
    
    durations = []
    status_codes = []
    
    # Create batches of concurrent requests
    batches = [args.concurrency] * (args.total // args.concurrency)
    if args.total % args.concurrency > 0:
        batches.append(args.total % args.concurrency)
    
    total_requests = 0
    start_time = time.time()
    
    # Process each batch
    for batch_size in batches:
        # Use a connector with proper cleanup for Windows
        connector = aiohttp.TCPConnector(force_close=True)
        async with aiohttp.ClientSession(connector=connector) as session:
            tasks = [send_async_request(session) for _ in range(batch_size)]
            results = await asyncio.gather(*tasks)
            
            for result in results:
                durations.append(result["duration"])
                status_codes.append(result["status_code"])
            
            total_requests += batch_size
            success_rate = status_codes.count(200) / len(status_codes) * 100
            
            print(f"Completed {total_requests}/{args.total} requests. Success rate: {success_rate:.1f}%")
    
    total_time = time.time() - start_time
    
    # Calculate statistics
    success_count = status_codes.count(200)
    success_rate = success_count / len(status_codes) * 100
    
    if durations:
        avg_duration = statistics.mean(durations)
        min_duration = min(durations)
        max_duration = max(durations)
        p95_duration = sorted(durations)[int(len(durations) * 0.95)]
        
        requests_per_second = args.total / total_time
        
        print("\n===== Load Test Results =====")
        print(f"Total requests: {args.total}")
        print(f"Concurrent requests: {args.concurrency}")
        print(f"Success rate: {success_rate:.1f}%")
        print(f"Total time: {total_time:.2f}s")
        print(f"Requests per second: {requests_per_second:.2f}")
        print(f"Average response time: {avg_duration*1000:.2f}ms")
        print(f"Min response time: {min_duration*1000:.2f}ms")
        print(f"Max response time: {max_duration*1000:.2f}ms")
        print(f"95th percentile response time: {p95_duration*1000:.2f}ms")
        print("=============================")

# Run the load test with proper cleanup
if __name__ == "__main__":
    try:
        asyncio.run(run_load_test())
    except KeyboardInterrupt:
        print("Test interrupted by user")
    finally:
        # Ensure event loop is closed
        if not asyncio.get_event_loop().is_closed():
            asyncio.get_event_loop().close()
