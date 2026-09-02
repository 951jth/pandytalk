# 💬 WebSocket 채팅 구현 요약 (Socket.io)

## 1. 핵심 아키텍처 흐름
1. **연결**: Client(`auth token` 전송) ↔ Server(인증 후 승인)
2. **입장**: Client(`join_room`) → Server(`socket.join`)
3. **전송**: Client(`emit msg`) → Server(DB 저장 후 `io.to().emit`)
4. **수신**: Client(`on msg`) → UI 업데이트

---

## 2. 클라이언트 핵심 로직 (RN)

```typescript
export const useChatSocket = (roomId: string) => {
  const socketRef = useRef<Socket | null>(null);

  // 전송 + Ack + 낙관적 업데이트
  const sendMessage = (text: string) => {
    const tempId = Date.now().toString();
    setMessages(prev => [...prev, { id: tempId, text, status: 'sending' }]);

    socketRef.current?.emit('send_message', { roomId, text }, (res) => {
      // 서버 응답(Ack)에 따른 상태 확정
      setMessages(prev => prev.map(m => m.id === tempId ? res.data : m));
    });
  };

  useEffect(() => {
    socketRef.current = io(URL, { auth: { token: 'JWT' } });
    // 1. 방 입장
    socketRef.current.emit('join_room', { roomId });
    socketRef.current.on('connect', () => {
      socketRef.current?.emit('sync_messages', { roomId, lastSeq });
    });
    socketRef.current.on('new_message', (msg) => setMessages(p => [...p, msg]));
    return () => {
      // 2. 방 퇴장 및 연결 종료
      socketRef.current?.emit('leave_room', { roomId });
      socketRef.current?.disconnect();
    };
  }, [roomId]); // roomId가 바뀔 때마다 실행
  return { messages, sendMessage };
};
```

---

## 3. 서버 핵심 로직 (Node.js)

```javascript
io.on('connection', (socket) => {
  socket.on('join_room', ({ roomId }) => socket.join(roomId));

  socket.on('send_message', async (payload, ack) => {
    const saved = await db.messages.create({ ...payload, seq: nextSeq() });
    socket.to(payload.roomId).emit('new_message', saved); // 나 제외 방송
    ack({ success: true, data: saved }); // 나에게 확인 응답
  });

  socket.on('sync_messages', async ({ lastSeq }) => {
    socket.emit('sync_results', await db.messages.findMany({ seq: { gt: lastSeq } }));
  });
});
```

---

## 4. 필수 함수 요약

| 함수 | 주체 | 설명 |
| :--- | :--- | :--- |
| **`connect`** | 클라 | 연결 시작 및 재연결 |
| **`emit` / `on`** | 공통 | 데이터 송신 / 수신 리스너 |
| **`join` / `leave`** | 서버 | 방(Room) 그룹 할당 및 제거 |
| **`to(room)`** | 서버 | 특정 방 인원에게만 방송 |

---

## 5. 하트비트 설정 (서버)
```javascript
const io = require('socket.io')(server, {
  pingInterval: 25000, // 25초마다 핑
  pingTimeout: 5000,   // 5초 이내 응답 없으면 종료
});
```
