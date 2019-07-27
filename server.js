const randomstring = require("randomstring");
const express = require('express');
const app = express();
const port = 3005;
const http = require("http").createServer(app);
const io = require("socket.io")(http);

let clients = {};
let arr_identifier = {};


app.get('/', function(req, res){
    res.sendFile(__dirname + '/public/index.html');
});
  
app.get('/control', function(req, res){
    res.sendFile(__dirname + '/public/control.html');
});

io.on("connection", (socket) => {

    let devicetype = socket.handshake.query['devicetype'];
    
	if(devicetype == 'desktop')
	{
        console.log("Device Type: ", devicetype);
		let token = randomstring.generate({
					charset: 'hex',
					length: 7
					});
		arr_identifier[socket.id] = {
			"token":token,
			"devicetype":"desktop"
		};		

		//console.info("NEW IDENTIFIER ", arr_identifier);
	    clients[token] = {
	      "desktop_socketId": socket.id
	    }; 

		io.to(socket.id).emit('token', token);  
		console.info('New client connected ('+token +' = '+ socket.id + ').');
	}
	else if(devicetype == 'mobile')
	{
		console.log("Device Type: ", devicetype);

		var desktop_socketId = '';
		var current_token = '';

		socket.on('initPairing', function(data){

            console.log("DATA: ", data);
			if(clients[data.token] != undefined )
			{			
				desktop_socketId = clients[data.token].desktop_socketId;		
				current_token = data.token;
				arr_identifier[socket.id] = {
					"token":data.token,
					"devicetype":"mobile"
				};		

			    clients[data.token]= {
			    	"desktop_socketId":desktop_socketId,
			      	"client_socketId": socket.id
			    }; 
			   
			    io.to(socket.id).emit('deviceDesktopPaired', {'status':'paired','token':data.token,'device_socketId':socket.id,'desktop_socketId':desktop_socketId});  
				io.to(desktop_socketId).emit('deviceDesktopPaired', {'status':'paired','token':data.token,'device_socketId':socket.id,'desktop_socketId':desktop_socketId});

				console.info("Paired: ",clients[data.token]);	
			}
			else
			{
			    io.to(socket.id).emit('deviceDesktopPaired', {'status':'failed','token':data.token,'device_socketId':'','desktop_socketId':''});  
				console.info("Paired: ERROR");					
			}
		});

		if(current_token != '')
		{
            if(clients[current_token] == undefined )
            {
				console.info("Token "+current_token+" not exists");	
			}
		}
		else
		{
			//io.to(socket.id).emit('token', token);  
		}
		socket.on('startTrigger', function(data){
			io.to(data.desktop_socketId).emit('startTrigger', data);
		});

	}


	socket.on('pairedSuccess', function(data){
		console.info('YYYYYYYYYYYYYYY' + data.desktop_socketId);
		io.to(data.desktop_socketId).emit('waitTrigger', {'trigger':'pending'});
		io.to(data.device_socketId).emit('waitTrigger', {'trigger':'pending'});

	});    
    
	socket.on('currentIngredient', function(data){
		io.to(data.device_socketId).emit('currentIngredient', data);
		console.info("XXXXXXXXXXXXXXXXXXXXXXX", data); 
	});

	socket.on('deviceorientation', function(data){
		var current_socketId = clients[data.token].desktop_socketId;	
		console.info("alpha "+Math.round(data.alpha) +" beta "+Math.round(data.beta) +" gamma "+ Math.round(data.gamma));
		io.to(current_socketId).emit('deviceorientation', data);
	});

	socket.on('devicePairedWithDesktop', function(data){
		var current_socketId = clients[data.token].client_socketId;	
		console.info("----- device Socket id  : " + current_socketId);
		console.info("devicePairedWithDesktop : " + data.paired);
		io.to(current_socketId).emit('devicePairedWithDesktop', data.paired);
	});    
});

http.listen(3005, () => {
    console.log('listening on *:' + port);
});
