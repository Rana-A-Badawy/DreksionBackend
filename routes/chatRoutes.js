import express from "express";
import {
  createConversation,
  getConversations,
  getConversation,
  sendMessage,
  getMessages,
  markAsRead,
  deleteMessage,
} from "../controllers/chatController.js";
import { auth } from "../middlewares/auth.js";

const router = express.Router();

router.use(auth("trainee", "instructor"));

router.post("/conversations", createConversation);
router.get("/conversations", getConversations);
router.get("/conversations/:conversationId", getConversation);

router.post("/conversations/:conversationId/messages", sendMessage);
router.get("/conversations/:conversationId/messages", getMessages);
router.put("/conversations/:conversationId/read", markAsRead);

router.delete("/messages/:messageId", deleteMessage);

export default router;
