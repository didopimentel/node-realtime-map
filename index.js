const express = require("express")
const app = express()
const http = require("http").createServer(app)
const io = require("socket.io")(http)

const markers = []
let users = []

app.use(express.static(__dirname + "/public"))

app.get("/", (req, res) => {
  res.sendFile(__dirname + "/index.html")
})

io.on("connection", (socket) => {
  console.log("a user connected")
  users.push({
    id: socket.id,
    timestamp: Date.now(),
  })
  socket.on("disconnect", () => {
    users = users.filter((u) => u.id !== socket.id)
    console.log("user disconnected")
  })
  socket.on("marker generated", (msg) => {
    markers.push({ ...msg, id: markers.length })
    io.emit("marker generated", {
      marker: { ...msg, id: markers.length - 1 },
      emitterSessionId: socket.id,
    })
  })
  socket.on("move marker", (msg) => {
    moveMarker(msg.lat, msg.lng, msg.markerId)
  })
})

moveMarker = (lat, lng, markerId) => {
  const marker = markers.find((m) => m.id == markerId)
  const calculatedLatDistance = lat - marker.coords.lat
  const calculatedLngDistance = lng - marker.coords.lng
  const interval = setInterval(() => {
    const speedFactor = 0.1
    const newLat = marker.coords.lat + calculatedLatDistance * speedFactor
    const newLng = marker.coords.lng + calculatedLngDistance * speedFactor
    marker.coords.lat = newLat
    marker.coords.lng = newLng
    io.emit("marker moved", marker)
  }, 500)
  const secondInterval = setInterval(() => {
    if (isMarkerInsideBoundariesOfDestination(marker, lat, lng)) {
      clearInterval(interval)
      clearInterval(secondInterval)
    }
  }, 100)
}

isMarkerInsideBoundariesOfDestination = (
  marker,
  destinationLat,
  destinationLng
) =>
  (marker.coords.lat.toFixed(4) >= destinationLat - 0.0001 ||
    marker.coords.lat.toFixed(4) <= destinationLat + 0.0001) &&
  (marker.coords.lng.toFixed(4) >= destinationLng - 0.0001 ||
    marker.coords.lng.toFixed(4) <= destinationLng + 0.0001)

http.listen(3000, () => {
  console.log("listening on *:3000")
})
