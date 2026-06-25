export const notificationSystemCanvas = {
  correctNodes: ["app-server", "kafka", "lambda", "message-queue"],
  criticalNodes: ["kafka", "lambda"],
  correctEdges: [
    { source: "app-server", target: "kafka" },
    { source: "kafka", target: "lambda" },
  ],
  hints: {
    kafka:
      "Kafka persists messages so workers can recover from crashes without losing notifications.",
    "lambda":
      "Separate workers per channel (push, SMS, email) isolate failures and scale independently.",
    "app-server":
      "The originating service (e.g., Payment Service) drops events — it doesn't send notifications directly.",
    "message-queue":
      "A message queue decouples the sender from the notification workers.",
  },
  answerNodes: [
    {
      nodeId: "app-server",
      componentType: "app-server",
      label: "Payment Service",
      icon: "⚙️",
      color: "#06B6D4",
      x: 400,
      y: 50,
    },
    {
      nodeId: "kafka",
      componentType: "kafka",
      label: "Kafka",
      icon: "📨",
      color: "#F97316",
      x: 400,
      y: 190,
    },
    {
      nodeId: "push-worker",
      componentType: "lambda",
      label: "Push Worker (FCM)",
      icon: "λ",
      color: "#8B5CF6",
      x: 160,
      y: 350,
    },
    {
      nodeId: "sms-worker",
      componentType: "lambda",
      label: "SMS Worker (Twilio)",
      icon: "λ",
      color: "#8B5CF6",
      x: 400,
      y: 350,
    },
    {
      nodeId: "email-worker",
      componentType: "lambda",
      label: "Email Worker (SendGrid)",
      icon: "λ",
      color: "#8B5CF6",
      x: 640,
      y: 350,
    },
  ],
  answerEdges: [
    { source: "app-server", target: "kafka", label: "publish event" },
    { source: "kafka", target: "push-worker", label: "push topic" },
    { source: "kafka", target: "sms-worker", label: "sms topic" },
    { source: "kafka", target: "email-worker", label: "email topic" },
  ],
};
