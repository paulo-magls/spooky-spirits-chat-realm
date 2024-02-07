// homepage elements
const title = document.querySelector(".container > h1")
const link = document.querySelector(".container > small")

// login elements
const login = document.querySelector(".login")
const loginForm = login.querySelector(".login__form")
const loginInput = login.querySelector(".login__input")

// chat elements
const chat = document.querySelector(".chat")
const chatForm = chat.querySelector(".chat__form")
const chatInput = chat.querySelector(".chat__input")
const chatParticipants = chat.querySelector(".chat__participants")

const colors = [
    "cadetblue",
    "darkgoldenrod",
    "cornflowerblue",
    "darkkhaki",
    "hotpink",
    "gold"
]

const user = { id: "", name: "", color: "", x: "", y: "" }

let websocket

const createUser = (userId, userName, userColor, x, y) => {
    const div = document.createElement("div")
    div.classList.add("participant")
    div.setAttribute("id", userId)
    div.style.left = x + "%"
    div.style.top = y + "%"

    const span = document.createElement("span")
    span.innerHTML = userName
    span.style.color = userColor
    div.appendChild(span)

    return div
}

const getRandomColor = () => {
    const randomIndex = Math.floor(Math.random() * colors.length)
    return colors[randomIndex]
}

const processMessage = ({ data }) => {
    const res = JSON.parse(data)

    if(res.type == 'update'){
        res.participants.forEach((p) => {
            const user = document.querySelector("#" + p.userId)

            // Adiciona se o usuario não estiver no chat
            if(!user){
                const participant = createUser(p.userId, p.userName, p.userColor, p.x, p.y)
                chatParticipants.appendChild(participant)
            }
        })
    } 
    
    else if(res.type == 'message'){
        createMessageSelf(res.userId, res.content)

        setTimeout(() => {
            removeMessageSelf(res.userId)
        }, 5000)
    } 
    
    else if(res.type == "movimentation"){
        moveParticipant(res.userId, res.x, res.y)
    }

    else if(res.type === "remove-participant") {
        removeParticipant(res.userId)
    }
}

const moveParticipant = (userId, x, y) => {
    const participant = document.querySelector("#" + userId)

    // Obtém a posição do participante
    const rect = participant.getBoundingClientRect();

    if(rect.width <= x){
        participant.style.backgroundImage = "url('./images/ghost-right.png')"      
    } else {
        participant.style.backgroundImage = "url('./images/ghost-left.png')"
    }
    
    participant.style.left = x + '%'
    participant.style.top = y + '%'
}

const removeParticipant = (userId) => {
    const participant = document.querySelector("#" + userId)

    chatParticipants.removeChild(participant)
}

const createMessageSelf = (userId, content) => {
    const user = document.querySelector("#" + userId)

    const message = document.createElement("div")
    message.classList.add("message--self")
    message.innerHTML = content

    user.appendChild(message)
}

const removeMessageSelf = (userId) => {
    const user = document.querySelector("#" + userId)
    message = user.querySelector(".message--self")

    user.removeChild(message)
}

const handleLogin = (event) => {
    event.preventDefault()

    user.id = "p" + crypto.randomUUID()
    user.name = loginInput.value
    user.color = getRandomColor()
    user.x = "50"
    user.y = "50"

    const message = {
        type: "create",
        userId: user.id,
        userName: user.name,
        userColor: user.color,
        x: user.x,
        y: user.y
    }

    title.style.display = "none"
    login.style.display = "none"
    link.style.display = "none"
    chat.style.display = "flex"

    websocket = new WebSocket("wss://chat-backend-7h5c.onrender.com");

    websocket.onopen = () => {
        websocket.send(JSON.stringify(message));
    };

    websocket.onmessage = processMessage
}

const sendMessage = (event) => {
    event.preventDefault()

    const message = {
        type: "message",
        userId: user.id,
        content: chatInput.value
    }

    websocket.send(JSON.stringify(message))

    chatInput.value = ""
}

loginForm.addEventListener("submit", handleLogin)
chatForm.addEventListener("submit", sendMessage)

chatParticipants.addEventListener("click", (event) => {
    const participant = document.getElementById(user.id)

    // Obtém a posição do participante
    const rect = participant.getBoundingClientRect();

    // Captura a coordenada do clique e converte para porcentagem
    const leftPercentage = Math.round((event.clientX - rect.width / 2) / window.innerWidth * 100)
    const topPercentage = Math.round((event.clientY - rect.height / 2) / window.innerHeight * 100)

    const message = {
        type: "movimentation",
        userId: user.id,
        x: leftPercentage,
        y: topPercentage
    }

    websocket.send(JSON.stringify(message))
})

window.addEventListener('unload', () => {
    message = {
        type: "exit",
        userId: user.id
    }

    websocket.send(JSON.stringify(message))
})
