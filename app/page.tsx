"use client";

import { useEffect, useRef, useState } from "react";
import { joinRoom, scale, MessageAction } from "trystero"

type Message = { value: string, peerId: string }

export default function Home() {
  const [message, setMessage] = useState("")
  const [recivedPrior, setRecivedPrior] = useState(false)
  const [messageList, setMessageList] = useState<Message[]>([])
  const messageListRef = useRef<Message[]>([]);
  const userIdRef = useRef<string>("")
  const sendRef = useRef<MessageAction<string> | null>(null)
  const deleteMessagesRef = useRef<MessageAction<boolean> | null>(null)
  useEffect(() => {
    const room = joinRoom({
      appId: 'username/mesh-test',
      use: [scale()]
    }, '0ced7494-cabc-4f7a-aeae-fc2695f4878a')
    const send = room.makeAction<string>("send")
    const priorMessages = room.makeAction<Message[]>("priorMessages")
    const deleteMessages = room.makeAction<boolean>("deleteMessages")
    sendRef.current = send
    deleteMessagesRef.current = deleteMessages
    room.onPeerJoin(({ peerId }) => {
      if (messageListRef.current.length !== 0) {
        priorMessages.send(messageListRef.current, { target: peerId })
      }
    })
    const getSelf = async () => {
      const { userId, peerId, identityPersistence } = await room.getSelf()
      userIdRef.current = userId
    }
    getSelf()
    send.onMessage((data, { peerId }) => {
      updateMessageList({ value: data, peerId: peerId })
    })
    priorMessages.onMessage((data) => {
      messageListRef.current = data
      setPrior(data)
    })
    deleteMessages.onMessage(() => {
      messageListRef.current = []
      setMessageList([])
    })
    return () => {
      room.leave()
    }
  }, [])

  function setPrior(data: Message[]) {
    if (!recivedPrior) {
      setMessageList(data)
      setRecivedPrior(true)
    }
  }

  function updateMessageList(value: Message) {
    setMessageList((current) => {
      const next = [...current, value]
      messageListRef.current = next
      return next;
    })
  }

  function onSubmit(event: React.SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    if (message === 'Delete') {
      deleteMessagesRef.current?.send(true)
      setMessageList([])
      messageListRef.current = []
    }
    else {
      sendRef.current?.send(message)
      updateMessageList({ value: message, peerId: userIdRef.current })
    }
    setMessage("")
  }

  return (
    <div style={{ backgroundColor: 'black', height: "100vh" }}>
      <form onSubmit={event => onSubmit(event)}>
        <input value={message} onChange={event => setMessage(event.target.value)} />
      </form>
      {messageList.map((x, i) => (
        <p key={i} >{`${x.peerId}: ${x.value}`}</p>
      ))}
    </div>
  )
}