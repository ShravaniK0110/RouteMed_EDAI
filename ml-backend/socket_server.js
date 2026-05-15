const express = require('express')
const http = require('http')
const socketIo = require('socket.io')
const cors = require('cors')

const app = express()
const server = http.createServer(app)
const io = socketIo(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ['GET', 'POST'],
  },
})

app.use(cors())
app.use(express.json())

let activeRides = []
let onlineParamedics = new Map()

io.on('connection', (socket) => {
  console.log('[SOCKET] Connected:', socket.id)

  // Paramedic goes online
  socket.on('paramedic:online', (data) => {
    onlineParamedics.set(socket.id, {
      paramedicId: data.paramedicId,
      socketId: socket.id,
    })
    socket.join('paramedics')
    console.log('[PARAMEDIC] Online:', data.paramedicId)
  })

  // Patient creates ride
  socket.on('ride:created', (rideData) => {
    activeRides.push(rideData)
    console.log('[RIDE] Created:', rideData.id)
    
    // Broadcast ONLY to online paramedics
    io.to('paramedics').emit('ride:new', rideData)
    console.log('[BROADCAST] Sent to', onlineParamedics.size, 'paramedics')
  })

  // Paramedic accepts ride
  socket.on('ride:accepted', (data) => {
    const ride = activeRides.find(r => r.id === data.rideId)
    if (ride) {
      ride.status = 'accepted'
      ride.paramedicId = data.paramedicId
      console.log('[RIDE] Accepted by:', data.paramedicId)
    }
  })

  socket.on('disconnect', () => {
    onlineParamedics.delete(socket.id)
    console.log('[SOCKET] Disconnected:', socket.id)
  })
})

server.listen(3001, () => {
  console.log('Socket.io server running on port 3001')
})