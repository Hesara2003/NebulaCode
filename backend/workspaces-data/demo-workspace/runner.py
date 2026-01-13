#!/usr/bin/env python3
# Python Example Script

def fibonacci(n):
    """Generate fibonacci sequence"""
    a, b = 0, 1
    for _ in range(n):
        yield a
        a, b = b, a + b

print("Fibonacci sequence (first 10):")
for num in fibonacci(10):
    print(num, end=" ")
print()
