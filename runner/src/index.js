console.log("Runner container started");

console.log('Runner started');
setTimeout(() => {
  console.log('Runner finished');
}, 3000);

// Example long-running task
let counter = 0;
const interval = setInterval(() => {
  console.log("Count:", counter++);
}, 1000);

// Stop after 5 seconds (just for test)
setTimeout(() => {
  console.log("Runner script finished");
  clearInterval(interval);
}, 5000);
