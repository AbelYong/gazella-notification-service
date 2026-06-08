import crypto from "node:crypto" 

export class StreamService {
    getBase64Ticket(lenght = 32) : string {
        return crypto.randomBytes(lenght).toString("base64url");
    }

    setTicket(ticket: string) {
        //todo: connect to redis
    }

    connect() {
        //todo
    }

    disconnect() {
        //todo
    }
}
