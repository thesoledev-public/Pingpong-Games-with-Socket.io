const io = require("socket.io-client");

let socket = io.connect("http://192.168.1.14:3000/");


socket.on("welcome",(data) => {
    console.log("Received: ", data);
});