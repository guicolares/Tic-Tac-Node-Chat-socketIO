var express = require('express');
var io = require('socket.io');

var app = module.exports = express.createServer();

var io = io.listen(app);
//settings

io.set('log level', 1); // Turn off annoying polling
app.configure(function(){
  app.set('views', __dirname + '/views');
  app.set('view engine', 'jade');
  app.use(express.bodyParser());
  app.use(express.methodOverride());
  app.use(app.router);
  app.use(express.static(__dirname + '/public'));
});

app.configure('development', function(){
  app.use(express.errorHandler({ dumpExceptions: true, showStack: true })); 
});

app.configure('production', function(){
  app.use(express.errorHandler()); 
});

// Routes

app.get('/', function(req, res){
  res.render('index');
});

app.listen(3000);
console.log("Server port %d running on %s", app.address().port, app.settings.env);

var xo = 'x'; 
var o = false;
var m_players = [];
var i = 0; // amount players

var static_grid = {
  '0-0': '', '0-1':'', '0-2':'',
  '1-0': '', '1-1':'', '1-2':'',
  '2-0': '', '2-1':'', '2-2': ''
}

var grid = {
  '0-0': '', '0-1':'', '0-2':'',
  '1-0': '', '1-1':'', '1-2':'',
  '2-0': '', '2-1':'', '2-2': ''
}


function getPlayer(socket_id){
	var n = 0;
	var aux_player;
	
	while (n < m_players.length)
    {
      if (m_players[n].id == socket_id)
      {
		aux_player = m_players[n].name; 
      }
      n++;
    }
	
	return aux_player;
}


io.sockets.on('connection', function(socket)
{
  
  socket.on('client_connected', function(player)
  {
    player.id = socket.id;
    player.mark = xo;
    
	if(xo == 'x' && o == false) 
    {
	 
      xo = 'o';
      o = true;
    }
    else
    {
      xo = 'spectator';
    }
    m_players[i] = player;
    i++;
    
    socket.emit('connect_1', player);
    //socket.emit('draw_board', board);
    io.sockets.emit('load',m_players);
  });
  
  socket.on('process_move', function(coords)
  {
    var n = 0;
	var aux_player;
    coords = coords.replace("#",'');
    
    while (n < m_players.length)
    {
      if (m_players[n].id == socket.id)
      {
		aux_player = m_players[n].name; 
        grid[coords] = m_players[n].mark;
      }
      n++;
    }
    
    // Atualizar o cliente com o movimento
    io.sockets.emit('mark', coords);
    
    // Verificar ganhador
    if( (grid['0-0'] == grid['0-1'] && grid['0-1'] == grid['0-2'] && grid['0-0'] != '') || 
    (grid['1-0'] == grid['1-1'] && grid['1-1'] == grid['1-2'] && grid['1-0'] != '') ||
    (grid['2-0'] == grid['2-1'] && grid['2-1'] == grid['2-2'] && grid['2-0'] != '') ||
    
    (grid['0-0'] == grid['1-0'] && grid['1-0'] == grid['2-0'] && grid['0-0'] != '') ||
    (grid['0-1'] == grid['1-1'] && grid['1-1'] == grid['2-1'] && grid['0-1'] != '') ||
    (grid['0-2'] == grid['1-2'] && grid['1-2'] == grid['2-2'] && grid['0-2'] != '') ||
    
    (grid['0-0'] == grid['1-1'] && grid['1-1'] == grid['2-2'] && grid['0-0'] != '') ||
    (grid['2-0'] == grid['1-1'] && grid['1-1'] == grid['0-2'] && grid['2-0'] != '') 
    )
    {
	  grid = static_grid;
	  console.log(grid);  
	  io.sockets.emit('gameover', aux_player);
    }
  });
  
  socket.on('disconnect', function()
   {
     var j = 0;
     var n = 0;
     var tmp = [];

     while (n < m_players.length)
     {
       if (m_players[j].id == socket.id)
       {
         if(m_players[j].mark == 'o')
         {
           xo = 'o';
           o = false;
         }
         if(m_players[j].mark == 'x')
         {
           xo = 'x';
         }
     	   n++;
     	 }
     	 
     	 if (n < m_players.length)
     	 {
     	   tmp[j] = m_players[n];
     	   j++;
     	   n++;
     	  }
     	}
     	
     	m_players = tmp;
     	i = j;
      io.sockets.emit('load', m_players);
   });
   
   socket.on('new message', function(data){
      var player = getPlayer(socket.id);
	  io.sockets.emit('new message',{
	    name:player,
		message:data
	  });
   });
   
  
});