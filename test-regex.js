const url = 'https://youtu.be/tHM6m177Xds?si=nUHVNt3rFs0BxxR-';
const trimmed = url.trim();
const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|\/shorts\/)([^#\&\?]*).*/;
const match = trimmed.match(regExp);
console.log(match ? match[2] : null);
