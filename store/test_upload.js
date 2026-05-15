async function test() {
  const buckets = [
    "articulos-redituables-altos.appspot.com",
    "articulos-redituables-altos.firebasestorage.app"
  ];
  
  for (const bucket of buckets) {
      const url = `https://firebasestorage.googleapis.com/v0/b/${encodeURIComponent(bucket)}/o?name=test.txt`;
      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain' },
        body: 'hello world'
      });
      const data = await res.json();
      console.log(bucket, res.status, data);
  }
}
test();
