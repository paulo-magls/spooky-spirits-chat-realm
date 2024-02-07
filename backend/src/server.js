const { WebSocketServer } = require("ws")
const dotenv = require("dotenv")
const participants = [];

dotenv.config()

const wss = new WebSocketServer({ port: process.env.PORT || 8080 })

// Evento de conexão: é disparado sempre que um cliente se conecta ao servidor WebSocket
wss.on("connection", (ws) => {

    ws.on("error", console.error)

    // Evento de mensagem: é disparado sempre que o servidor recebe uma mensagem de um cliente
    ws.on("message", (data) => {
        const request = JSON.parse(data)

        if(request.type === "create"){
            delete request.type

            // Adiciona o novo cliente na lista de participantes
            participants.push(request)

            const update = {
                type: "update",
                participants: participants
            }

            // Envia todos os clientes online para o frontend
            wss.clients.forEach((client) => client.send(JSON.stringify(update)))
        } 
        
        else if(request.type === "movimentation") {
            const participantIndex = participants.findIndex(p => p.userId === request.userId)

            if(participantIndex !== -1) {
                const participant = participants[participantIndex]

                participants[participantIndex] = {
                    userId: participant.userId,
                    userName: participant.userName,
                    userColor: participant.userColor,
                    x: request.x, 
                    y: request.y
                }
            }

            // Envia a movimentação para todos os clientes
            wss.clients.forEach((client) => client.send(data.toString()))
        }

        else if(request.type === "exit") {
            const participantIndex = participants.findIndex(p => p.userId === request.userId)

            if(participantIndex !== -1) {
                participants.splice(participantIndex, 1)

                const update = {
                    type: "remove-participant",
                    userId: request.userId
                }
    
                // Envia a mensagem para todos os clientes online
                wss.clients.forEach((client) => client.send(JSON.stringify(update)))
            }
        }
        
        else
            // Envia a mensagem de volta para todos os clientes
            wss.clients.forEach((client) => client.send(data.toString()))
    })
})