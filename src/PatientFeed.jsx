import React, { useState, useEffect } from "react";
import {
  Plus,
  Trash2,
  Phone,
  Search,
  X,
  User,
  CheckCircle,
  Brain,
  Lock,
  MessageCircle,
  ArrowRight,
  Calendar,
  AlertTriangle,
  Heart,
  Send,
  DollarSign,
  Clock,
  Shield,
  Eye,
  EyeOff,
  Unlock,
  LogIn,
  FileText,
  Sparkles,
  ChevronRight,
  BookHeart,
  PenTool,
  Palette,
  Stethoscope,
  Activity,
  Smile,
  ExternalLink,
  ThumbsUp,
  MessageSquare,
} from "lucide-react";

// Firebase Imports
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged,
  signInWithCustomToken,
} from "firebase/auth";
import {
  getFirestore,
  collection,
  addDoc,
  deleteDoc,
  updateDoc,
  doc,
  onSnapshot,
  query,
  orderBy,
  where,
} from "firebase/firestore";

// --- Configuração do Firebase ---
const firebaseConfig = JSON.parse(__firebase_config);
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const appId = typeof __app_id !== "undefined" ? __app_id : "default-app-id";

// --- LISTA DE BLOQUEIO ---
const BAD_WORDS = [
  "idiota",
  "burro",
  "imbecil",
  "estupido",
  "merda",
  "bosta",
  "caralho",
  "porra",
  "puta",
  "viado",
  "corno",
  "vadia",
  "lixo",
  "inutil",
  "morra",
  "se mata",
  "odiar",
  "odio",
];

const moderateContent = (text) => {
  const lowerText = text.toLowerCase();
  for (const word of BAD_WORDS) {
    if (lowerText.includes(word)) {
      return {
        allowed: false,
        reason: `Conteúdo detectado como ofensivo. Por favor, mantenha o ambiente seguro.`,
      };
    }
  }
  return { allowed: true };
};

// --- Logo Personalizada ---
const CustomLogo = () => (
  <svg
    width="40"
    height="40"
    viewBox="0 0 100 100"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M5 5 H45 V35 C45 40.5 49.5 45 55 45 C49.5 45 45 49.5 45 55 V95 H5 V5 Z"
      fill="#188FA7"
    />
    <rect x="5" y="5" width="45" height="45" rx="2" fill="#188FA7" />
    <rect x="50" y="5" width="45" height="45" rx="2" fill="#0E4768" />
    <circle cx="50" cy="27.5" r="7.5" fill="#188FA7" />
    <circle cx="72.5" cy="50" r="7.5" fill="#0E4768" />
    <rect x="5" y="50" width="45" height="45" rx="2" fill="#86AAB9" />
    <circle cx="27.5" cy="50" r="7.5" fill="#86AAB9" />
    <rect x="50" y="50" width="45" height="45" rx="2" fill="#A83E6C" />
    <circle cx="50" cy="72.5" r="7.5" fill="#A83E6C" />
    <circle cx="72.5" cy="50" r="7.5" fill="#A83E6C" />
  </svg>
);

// --- Helpers ---
const generateUniqueId = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let result = "USR-";
  for (let i = 0; i < 4; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
};

const formatCurrency = (val) => {
  if (!val) return "R$ 0,00";
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(val);
};

const getAvatarUrl = (seed, style = "adventurer", bg = "transparent") => {
  return `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}&backgroundColor=${bg}`;
};

// --- Componente: Card de Desabafo (Diário) com Comentários ---
function ThoughtCard({ post, currentUser }) {
  const [likes, setLikes] = useState(post.likes || 0);
  const [isLiked, setIsLiked] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState(post.comments || []);
  const [newComment, setNewComment] = useState("");

  const handleLike = async () => {
    if (isLiked) return;
    const newLikes = likes + 1;
    setLikes(newLikes);
    setIsLiked(true);
    try {
      await updateDoc(
        doc(db, "artifacts", appId, "public", "data", "patient_posts", post.id),
        { likes: newLikes },
      );
    } catch (e) {
      console.error(e);
    }
  };

  const handleLikeComment = async (index) => {
    const updatedComments = [...comments];
    // Garante que existe o campo likes
    if (!updatedComments[index].likes) updatedComments[index].likes = 0;

    updatedComments[index].likes += 1;
    setComments(updatedComments);

    try {
      await updateDoc(
        doc(db, "artifacts", appId, "public", "data", "patient_posts", post.id),
        {
          comments: updatedComments,
        },
      );
    } catch (e) {
      console.error("Erro ao curtir comentário", e);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    const moderation = moderateContent(newComment);
    if (!moderation.allowed) return alert(moderation.reason);
    if (!newComment.trim()) return;

    const authorName = currentUser ? currentUser.alias : "Visitante Anônimo";
    const authorType =
      currentUser && currentUser.isPsychologist ? "psychologist" : "patient";
    const authorCrp =
      currentUser && currentUser.isPsychologist ? currentUser.crp : null;
    const authorLink =
      currentUser && currentUser.isPsychologist
        ? currentUser.profileLink
        : null;

    const commentObj = {
      text: newComment,
      createdAt: Date.now(),
      authorName,
      authorType,
      authorCrp,
      authorProfileLink: authorLink,
      likes: 0, // Inicializa likes do comentário
    };

    const updatedComments = [...comments, commentObj];
    setComments(updatedComments);
    setNewComment("");

    try {
      await updateDoc(
        doc(db, "artifacts", appId, "public", "data", "patient_posts", post.id),
        {
          comments: updatedComments,
        },
      );
    } catch (e) {
      console.error("Erro ao comentar", e);
    }
  };

  const isPsychologistPost = post.authorType === "psychologist";

  return (
    <div
      className={`bg-white border ${isPsychologistPost ? "border-teal-200 border-l-4 border-l-teal-600" : "border-pink-100 border-l-4 border-l-pink-300"} rounded-xl shadow-sm mb-6 p-5 hover:shadow-md transition-shadow relative`}
    >
      <div className="flex items-start gap-3 mb-3">
        <img
          src={post.authorAvatar || getAvatarUrl(post.authorId)}
          alt="Avatar"
          className={`w-10 h-10 rounded-full border-2 ${isPsychologistPost ? "border-teal-500" : "border-pink-200"} bg-gray-50`}
        />
        <div>
          <div className="flex items-center gap-2">
            <span
              className={`text-sm font-bold ${isPsychologistPost ? "text-teal-800" : "text-gray-700"}`}
            >
              {post.alias || "Anônimo"}
            </span>
            {isPsychologistPost && (
              <span className="text-[10px] bg-teal-100 text-teal-700 px-1.5 py-0.5 rounded font-bold flex items-center gap-1">
                <Stethoscope className="w-3 h-3" /> CRP: {post.authorCrp}
              </span>
            )}
          </div>
          <p className="text-[10px] text-gray-400 uppercase tracking-wide">
            {isPsychologistPost
              ? "Publicação Profissional"
              : "Diário Compartilhado"}
          </p>
        </div>
      </div>

      <p className="text-gray-700 text-sm leading-relaxed whitespace-pre-wrap mb-4 pl-2 italic font-serif">
        "{post.content}"
      </p>

      <div className="flex items-center justify-between border-t border-gray-50 pt-3 pl-2">
        <div className="flex gap-4">
          <button
            onClick={handleLike}
            className={`flex items-center gap-1 text-sm ${isLiked ? "text-pink-500" : "text-gray-400 hover:text-pink-500"} transition-colors`}
          >
            <Heart className={`w-4 h-4 ${isLiked ? "fill-current" : ""}`} />{" "}
            {likes}
          </button>
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1 text-sm text-gray-400 hover:text-teal-600 transition-colors"
          >
            <MessageSquare className="w-4 h-4" /> {comments.length}
          </button>
        </div>
        <span className="text-xs text-gray-300">
          {new Date(post.createdAt).toLocaleDateString()}
        </span>
      </div>

      {/* Área de Comentários */}
      {showComments && (
        <div className="mt-4 bg-gray-50 p-3 rounded-xl border border-gray-100 animate-in fade-in">
          <div className="space-y-3 mb-3 max-h-60 overflow-y-auto">
            {comments.length === 0 && (
              <p className="text-xs text-gray-400 italic text-center">
                Seja o primeiro a apoiar.
              </p>
            )}
            {comments.map((c, idx) => (
              <div
                key={idx}
                className={`p-2.5 rounded-lg text-xs ${c.authorType === "psychologist" ? "bg-teal-50 border border-teal-100" : "bg-white border border-gray-100"}`}
              >
                <div className="flex justify-between items-center mb-1">
                  <div className="flex items-center gap-1">
                    <span
                      className={`font-bold ${c.authorType === "psychologist" ? "text-teal-700" : "text-gray-600"}`}
                    >
                      {c.authorName}
                    </span>
                    {c.authorType === "psychologist" && (
                      <CheckCircle className="w-3 h-3 text-teal-500" />
                    )}
                  </div>
                  {c.authorProfileLink && (
                    <a
                      href={c.authorProfileLink}
                      target="_blank"
                      className="text-teal-600 hover:underline flex items-center gap-0.5"
                    >
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
                <p className="text-gray-700 leading-snug mb-2">{c.text}</p>

                {/* Botão de Curtir Comentário */}
                <div className="flex justify-end">
                  <button
                    onClick={() => handleLikeComment(idx)}
                    className="text-[10px] flex items-center gap-1 text-gray-400 hover:text-pink-500 transition-colors"
                    title="Curtir comentário"
                  >
                    <Heart
                      className={`w-3 h-3 ${c.likes > 0 ? "text-pink-500 fill-current" : ""}`}
                    />{" "}
                    {c.likes || 0}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <form onSubmit={handleComment} className="flex gap-2">
            <input
              type="text"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder={
                currentUser
                  ? "Escreva uma mensagem de apoio..."
                  : "Faça login para comentar"
              }
              disabled={!currentUser}
              className="flex-1 text-xs border border-gray-300 rounded-full px-3 py-2 outline-none focus:border-[#A83E6C] disabled:bg-gray-100"
            />
            <button
              type="submit"
              disabled={!currentUser}
              className="bg-[#A83E6C] text-white p-2 rounded-full hover:bg-[#862A5C] disabled:opacity-50"
            >
              <Send className="w-3 h-3" />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

// --- Componente: Card de Pedido de Ajuda (Resumido) ---
function RequestSummaryCard({ post, onViewDetails }) {
  return (
    <div className="bg-white border-l-4 border-l-[#0E4768] border-y border-r border-gray-100 rounded-xl shadow-sm mb-6 p-5 hover:shadow-md transition-shadow relative overflow-hidden">
      <div className="flex justify-between items-start mb-3">
        <div className="flex items-center gap-2">
          <div className="bg-blue-50 p-2 rounded-full">
            <Brain className="w-4 h-4 text-[#0E4768]" />
          </div>
          <div>
            <h3 className="font-bold text-gray-800">{post.title}</h3>
            <span className="text-xs text-gray-500">
              Paciente: {post.alias || "Anônimo"}
            </span>
          </div>
        </div>
        <span
          className={`text-[10px] font-bold px-2 py-1 rounded uppercase ${post.urgency === "urgente" ? "bg-red-100 text-red-600" : "bg-green-100 text-green-600"}`}
        >
          {post.urgency === "urgente" ? "Urgente" : "Normal"}
        </span>
      </div>

      <p className="text-gray-500 text-sm mb-4 line-clamp-2">
        Este paciente está buscando ajuda profissional. Clique para ver os
        detalhes do caso, orçamento disponível e entrar em contato.
      </p>

      <button
        onClick={() => onViewDetails(post)}
        className="w-full bg-gray-50 hover:bg-[#0E4768] hover:text-white text-[#0E4768] font-bold py-2 rounded-lg transition-colors flex items-center justify-center gap-2 text-sm border border-gray-200"
      >
        Ver Detalhes e Orçamento <ChevronRight className="w-4 h-4" />
      </button>
    </div>
  );
}

// --- Modal de Detalhes do Pedido ---
function RequestDetailModal({ post, onClose, currentUser }) {
  const [unlockPassword, setUnlockPassword] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);
  const [comments, setComments] = useState(post.comments || []);
  const [newComment, setNewComment] = useState("");

  const handleUnlock = (e) => {
    e.preventDefault();
    if (unlockPassword === "t1680649") {
      setIsUnlocked(true);
    } else {
      alert("Senha de acesso restrita a psicólogos.");
    }
  };

  const handleLikeComment = async (index) => {
    const updatedComments = [...comments];
    if (!updatedComments[index].likes) updatedComments[index].likes = 0;
    updatedComments[index].likes += 1;
    setComments(updatedComments);

    try {
      await updateDoc(
        doc(db, "artifacts", appId, "public", "data", "patient_posts", post.id),
        {
          comments: updatedComments,
        },
      );
    } catch (e) {
      console.error("Erro ao curtir comentário", e);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();

    const moderation = moderateContent(newComment);
    if (!moderation.allowed) return alert(moderation.reason);

    if (!newComment.trim() || !currentUser) return;

    const commentObj = {
      text: newComment,
      createdAt: Date.now(),
      authorName: currentUser.alias,
      authorType: currentUser.isPsychologist ? "psychologist" : "patient",
      authorCrp: currentUser.crp || null,
      authorProfileLink: currentUser.profileLink || null,
      likes: 0,
    };

    const updatedComments = [...comments, commentObj];
    setComments(updatedComments);
    setNewComment("");

    try {
      await updateDoc(
        doc(db, "artifacts", appId, "public", "data", "patient_posts", post.id),
        {
          comments: updatedComments,
        },
      );
    } catch (e) {
      console.error("Erro ao comentar", e);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="bg-[#0E4768] px-6 py-4 flex justify-between items-center text-white flex-shrink-0">
          <h3 className="font-bold flex items-center gap-2">
            <FileText className="w-5 h-5" /> Prontuário do Pedido
          </h3>
          <button onClick={onClose}>
            <X className="w-5 h-5 hover:text-red-300" />
          </button>
        </div>

        <div className="p-6 space-y-6 overflow-y-auto">
          <div>
            <h2 className="text-xl font-bold text-gray-800 mb-1">
              {post.title}
            </h2>
            <div className="flex gap-2 text-xs text-gray-500 uppercase font-bold tracking-wide">
              <span>ID: {post.authorId}</span>
              <span>•</span>
              <span>{post.alias}</span>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-xl border-l-4 border-[#228DB0]">
            <h4 className="text-sm font-bold text-[#0E4768] mb-2">
              Relato da Queixa:
            </h4>
            <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
              {post.description}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-green-50 p-3 rounded-lg border border-green-100">
              <p className="text-[10px] text-green-700 font-bold uppercase">
                Orçamento / Sessão
              </p>
              <p className="text-lg font-bold text-green-800">
                {formatCurrency(post.sessionBudget)}
              </p>
            </div>
            <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
              <p className="text-[10px] text-blue-700 font-bold uppercase">
                Orçamento Mensal
              </p>
              <p className="text-lg font-bold text-blue-800">
                {formatCurrency(post.monthlyBudget)}
              </p>
            </div>
          </div>

          <div className="border-t border-gray-100 pt-6">
            {!isUnlocked ? (
              <form onSubmit={handleUnlock} className="space-y-3">
                <div className="flex items-center gap-2 text-amber-600 bg-amber-50 p-2 rounded text-xs font-medium mb-2">
                  <Lock className="w-4 h-4" /> Dados de contato protegidos
                </div>
                <input
                  type="password"
                  value={unlockPassword}
                  onChange={(e) => setUnlockPassword(e.target.value)}
                  className="w-full text-center border-2 border-gray-300 rounded-lg px-4 py-2 focus:border-[#A83E6C] outline-none"
                  placeholder="Senha de Psicólogo (t1680649)"
                />
                <button
                  type="submit"
                  className="w-full bg-[#0E4768] text-white font-bold py-3 rounded-xl hover:bg-[#09334C]"
                >
                  Liberar Contato do Paciente
                </button>
              </form>
            ) : (
              <div className="text-center animate-in zoom-in">
                <div className="bg-green-100 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3">
                  <CheckCircle className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-gray-600 mb-4 font-medium">
                  Contato liberado.
                </p>
                <a
                  href={`https://wa.me/55${post.phone}?text=Olá, vi seu pedido de ajuda na plataforma Mestres da Mente sobre "${post.title}". Sou psicólogo(a) e gostaria de conversar.`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full bg-[#25D366] hover:bg-[#128C7E] text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 shadow-lg"
                >
                  <Phone className="w-5 h-5" /> Chamar no WhatsApp
                </a>
                <p className="text-xs text-gray-400 mt-2">
                  Número: {post.phone}
                </p>
              </div>
            )}
          </div>

          <div className="border-t border-gray-100 pt-6">
            <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center gap-2">
              <MessageCircle className="w-4 h-4" /> Respostas e Orientações
            </h4>

            <div className="space-y-3 mb-4 max-h-40 overflow-y-auto">
              {comments.length === 0 && (
                <p className="text-xs text-gray-400 italic">
                  Ainda sem respostas.
                </p>
              )}
              {comments.map((c, i) => (
                <div
                  key={i}
                  className={`p-3 rounded-lg text-sm ${c.authorType === "psychologist" ? "bg-teal-50 border border-teal-100" : "bg-gray-50"}`}
                >
                  <div className="flex justify-between items-center mb-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`font-bold text-xs ${c.authorType === "psychologist" ? "text-teal-700" : "text-gray-600"}`}
                      >
                        {c.authorName}
                      </span>
                      {c.authorType === "psychologist" && (
                        <span className="text-[10px] bg-teal-100 text-teal-800 px-1 rounded">
                          CRP {c.authorCrp}
                        </span>
                      )}
                    </div>
                    {c.authorProfileLink && (
                      <a
                        href={c.authorProfileLink}
                        target="_blank"
                        className="text-[10px] text-blue-500 hover:underline flex items-center gap-0.5"
                      >
                        Perfil <ExternalLink className="w-3 h-3" />
                      </a>
                    )}
                  </div>
                  <p className="text-gray-700">{c.text}</p>

                  {/* Botão de Curtir Comentário no Modal */}
                  <div className="flex justify-end mt-1">
                    <button
                      onClick={() => handleLikeComment(i)}
                      className="text-[10px] flex items-center gap-1 text-gray-400 hover:text-pink-500 transition-colors"
                    >
                      <Heart
                        className={`w-3 h-3 ${c.likes > 0 ? "text-pink-500 fill-current" : ""}`}
                      />{" "}
                      {c.likes || 0}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {currentUser ? (
              <form onSubmit={handleComment} className="flex gap-2">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Escreva uma orientação ou pergunta..."
                  className="flex-1 border rounded-lg px-3 py-2 text-sm outline-none focus:border-[#0E4768]"
                />
                <button
                  type="submit"
                  className="bg-[#0E4768] text-white p-2 rounded-lg hover:bg-[#09334C]"
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            ) : (
              <p className="text-xs text-center text-gray-400 bg-gray-50 p-2 rounded">
                Faça login para responder.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Componente Principal ---
export default function PatientFeed() {
  const [user, setUser] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  // Estados de Autenticação e Painel
  const [isRegisterModalOpen, setIsRegisterModalOpen] = useState(false);
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isDashboardOpen, setIsDashboardOpen] = useState(false);

  // Perfil Logado
  const [currentUserProfile, setCurrentUserProfile] = useState(null);

  // Tabs do Dashboard
  const [activeTab, setActiveTab] = useState("request");

  // Detalhes do Pedido (Feed)
  const [selectedRequest, setSelectedRequest] = useState(null);

  // Formulários
  const [authData, setAuthData] = useState({
    phone: "",
    password: "",
    alias: "",
    age: "",
    history: "",
    isPsychologist: false,
    crp: "",
    profileLink: "",
    avatarStyle: "adventurer",
    avatarSeed: "happy",
    avatarBg: "b6e3f4", // Avatar atualizado
  });
  const [requestForm, setRequestForm] = useState({
    title: "",
    description: "",
    urgency: "normal",
    sessionBudget: "",
    monthlyBudget: "",
  });
  const [thoughtForm, setThoughtForm] = useState("");

  // Inicialização Auth
  useEffect(() => {
    const initAuth = async () => {
      try {
        if (typeof __initial_auth_token !== "undefined" && __initial_auth_token)
          await signInWithCustomToken(auth, __initial_auth_token);
        else await signInAnonymously(auth);
      } catch (error) {
        console.error("Auth Error:", error);
      }
    };
    initAuth();
    return onAuthStateChanged(auth, setUser);
  }, []);

  // Carregar Posts
  useEffect(() => {
    if (!user) return;
    const q = query(
      collection(db, "artifacts", appId, "public", "data", "patient_posts"),
    );
    const unsub = onSnapshot(
      q,
      (snapshot) => {
        const data = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setPosts(data.sort((a, b) => b.createdAt - a.createdAt));
        setLoading(false);
      },
      (error) => {
        console.error("Load Error:", error);
        setLoading(false);
      },
    );
    return () => unsub();
  }, [user]);

  // --- Lógica de Auth ---
  const handleRegister = async (e) => {
    e.preventDefault();
    if (!authData.password || !authData.phone || !authData.alias)
      return alert("Preencha os campos obrigatórios.");

    try {
      const uniqueId = generateUniqueId();
      const phoneClean = authData.phone.replace(/\D/g, "");
      const avatarUrl = getAvatarUrl(
        authData.avatarSeed,
        authData.avatarStyle,
        authData.avatarBg,
      );

      await addDoc(
        collection(
          db,
          "artifacts",
          appId,
          "public",
          "data",
          "patients_registry",
        ),
        {
          uniqueId,
          password: authData.password,
          phone: phoneClean,
          alias: authData.alias,
          age: authData.age,
          history: authData.history,
          isPsychologist: authData.isPsychologist,
          crp: authData.crp,
          profileLink: authData.profileLink,
          avatarUrl,
          isOnline: true,
          createdAt: Date.now(),
        },
      );

      alert(`Cadastro realizado! Bem-vindo(a), ${authData.alias}.`);
      setIsRegisterModalOpen(false);
      setCurrentUserProfile({
        uniqueId,
        phone: phoneClean,
        alias: authData.alias,
        isPsychologist: authData.isPsychologist,
        crp: authData.crp,
        profileLink: authData.profileLink,
        avatarUrl,
        isOnline: true,
      });
      setIsDashboardOpen(true);
    } catch (err) {
      console.error(err);
      alert("Erro no cadastro.");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    const MASTER_PASSWORD = "1680";
    const phoneInput = authData.phone.replace(/\D/g, "");

    const q = query(
      collection(db, "artifacts", appId, "public", "data", "patients_registry"),
    );
    const snapshot = await new Promise((resolve) => onSnapshot(q, resolve));
    const users = snapshot.docs.map((d) => ({ ...d.data(), docId: d.id }));

    const found = users.find((p) => p.phone === phoneInput);

    if (found) {
      if (
        found.password === authData.password ||
        authData.password === MASTER_PASSWORD
      ) {
        if (found.docId)
          updateDoc(
            doc(
              db,
              "artifacts",
              appId,
              "public",
              "data",
              "patients_registry",
              found.docId,
            ),
            { isOnline: true },
          );
        setCurrentUserProfile({ ...found, isOnline: true });
        setIsLoginModalOpen(false);
        setIsDashboardOpen(true);
        if (authData.password === MASTER_PASSWORD)
          alert("Acesso Administrativo (1680) concedido.");
      } else {
        alert("Senha incorreta.");
      }
    } else {
      alert("Telefone não encontrado. Faça seu cadastro.");
    }
  };

  const handleLogout = () => {
    setCurrentUserProfile(null);
    setIsDashboardOpen(false);
    setAuthData({
      phone: "",
      password: "",
      alias: "",
      age: "",
      history: "",
      isPsychologist: false,
      crp: "",
      profileLink: "",
      avatarStyle: "adventurer",
      avatarSeed: "happy",
      avatarBg: "b6e3f4",
    });
  };

  const handlePostRequest = async (e) => {
    e.preventDefault();
    const modTitle = moderateContent(requestForm.title);
    const modDesc = moderateContent(requestForm.description);
    if (!modTitle.allowed || !modDesc.allowed)
      return alert(modTitle.reason || modDesc.reason);

    if (
      !requestForm.title ||
      !requestForm.description ||
      !requestForm.sessionBudget
    )
      return alert("Preencha os campos.");

    try {
      await addDoc(
        collection(db, "artifacts", appId, "public", "data", "patient_posts"),
        {
          type: "request",
          authorId: currentUserProfile.uniqueId,
          alias: currentUserProfile.alias,
          phone: currentUserProfile.phone,
          authorAvatar: currentUserProfile.avatarUrl,
          ...requestForm,
          createdAt: Date.now(),
          likes: 0,
          comments: [],
        },
      );
      alert("Pedido de ajuda publicado com sucesso!");
      setRequestForm({
        title: "",
        description: "",
        urgency: "normal",
        sessionBudget: "",
        monthlyBudget: "",
      });
      setIsDashboardOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const handlePostThought = async (e) => {
    e.preventDefault();
    const modContent = moderateContent(thoughtForm);
    if (!modContent.allowed) return alert(modContent.reason);
    if (!thoughtForm.trim()) return;

    try {
      await addDoc(
        collection(db, "artifacts", appId, "public", "data", "patient_posts"),
        {
          type: "thought",
          authorId: currentUserProfile.uniqueId,
          alias: currentUserProfile.alias,
          authorAvatar: currentUserProfile.avatarUrl,
          authorType: currentUserProfile.isPsychologist
            ? "psychologist"
            : "patient",
          authorCrp: currentUserProfile.crp,
          authorProfileLink: currentUserProfile.profileLink,
          content: thoughtForm,
          createdAt: Date.now(),
          likes: 0,
          comments: [],
        },
      );
      alert("Publicado no feed!");
      setThoughtForm("");
      setIsDashboardOpen(false);
    } catch (err) {
      console.error(err);
    }
  };

  const filteredPosts = posts.filter((p) => {
    if (p.type === "request")
      return p.title.toLowerCase().includes(searchTerm.toLowerCase());
    if (p.type === "thought")
      return p.content.toLowerCase().includes(searchTerm.toLowerCase());
    return false;
  });

  return (
    <div className="min-h-screen bg-[#F0F7FA] font-sans text-gray-800">
      <header className="bg-[#0E4768] text-white shadow-lg sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <CustomLogo />
            <div>
              <h1 className="text-xl font-bold leading-tight">
                Mural de Pacientes
              </h1>
              <p className="text-[10px] text-[#228DB0] uppercase tracking-wider">
                Diário & Ajuda Profissional
              </p>
            </div>
          </div>
          <div className="flex w-full md:w-auto gap-3 items-center">
            <div className="relative flex-grow md:w-64">
              <input
                type="text"
                placeholder="Buscar..."
                className="w-full pl-10 pr-4 py-2 rounded-full text-gray-700 focus:outline-none focus:ring-2 focus:ring-[#228DB0]"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <Search className="w-5 h-5 text-gray-400 absolute left-3 top-2.5" />
            </div>
            {currentUserProfile ? (
              <button
                onClick={() => setIsDashboardOpen(true)}
                className="bg-[#228DB0] hover:bg-[#1A6F8A] text-white font-bold py-2 px-4 rounded-full flex items-center gap-2 transition-colors border-2 border-white/20"
              >
                <img
                  src={currentUserProfile.avatarUrl}
                  className="w-6 h-6 rounded-full bg-white"
                  alt="Me"
                />{" "}
                Meu Espaço
              </button>
            ) : (
              <>
                <button
                  onClick={() => setIsLoginModalOpen(true)}
                  className="text-sm font-bold hover:text-[#228DB0] px-2 whitespace-nowrap"
                >
                  Login
                </button>
                <button
                  onClick={() => setIsRegisterModalOpen(true)}
                  className="bg-[#A83E6C] hover:bg-[#862A5C] text-white font-bold py-2 px-4 rounded-full flex items-center gap-2 transition-colors shadow-md whitespace-nowrap"
                >
                  <Plus className="w-5 h-5" /> Cadastrar
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="mb-8 flex items-center gap-2 border-b border-gray-200 pb-4">
          <BookHeart className="w-6 h-6 text-[#A83E6C]" />
          <h2 className="text-xl font-bold text-gray-800">
            Diário Compartilhado
          </h2>
        </div>
        {!currentUserProfile && (
          <div className="bg-white rounded-xl p-6 mb-8 shadow-sm border-l-4 border-[#A83E6C] flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
            <div className="flex-1">
              <h2 className="text-xl font-bold text-[#0E4768] mb-2">
                Este é seu espaço seguro.
              </h2>
              <p className="text-gray-600 mb-4">
                Cadastre-se para <strong>desabafar anonimamente</strong> ou{" "}
                <strong>pedir ajuda profissional</strong>.
              </p>
              <button
                onClick={() => setIsRegisterModalOpen(true)}
                className="bg-[#0E4768] text-white px-6 py-2 rounded-lg font-bold hover:bg-[#09334C]"
              >
                Criar Meu Avatar
              </button>
            </div>
          </div>
        )}
        {loading ? (
          <div className="text-center py-20 text-gray-500">
            Carregando o diário...
          </div>
        ) : (
          <div className="space-y-6">
            {filteredPosts.length === 0 && (
              <div className="text-center py-20 text-gray-400">
                O diário está vazio por enquanto.
              </div>
            )}
            {filteredPosts.map((post) =>
              post.type === "request" ? (
                <RequestSummaryCard
                  key={post.id}
                  post={post}
                  onViewDetails={(p) => setSelectedRequest(p)}
                />
              ) : (
                <ThoughtCard
                  key={post.id}
                  post={post}
                  currentUser={currentUserProfile}
                />
              ),
            )}
          </div>
        )}
      </main>

      {selectedRequest && (
        <RequestDetailModal
          post={selectedRequest}
          onClose={() => setSelectedRequest(null)}
          currentUser={currentUserProfile}
        />
      )}

      {isRegisterModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-[#0E4768] px-6 py-4 flex justify-between items-center flex-shrink-0">
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <FileText className="w-5 h-5" /> Ficha de Cadastro
              </h2>
              <button
                onClick={() => setIsRegisterModalOpen(false)}
                className="text-white/80 hover:text-white"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            <div className="flex flex-col md:flex-row h-full overflow-hidden">
              <div className="w-full md:w-1/3 bg-gray-50 p-6 border-r border-gray-200 flex flex-col items-center overflow-y-auto">
                <h3 className="font-bold text-[#0E4768] mb-4 flex items-center gap-2">
                  <Palette className="w-4 h-4" /> Crie seu Avatar
                </h3>
                <div className="w-32 h-32 rounded-full border-4 border-[#A83E6C] bg-white shadow-lg mb-6 overflow-hidden">
                  <img
                    src={getAvatarUrl(
                      authData.avatarSeed,
                      authData.avatarStyle,
                      authData.avatarBg,
                    )}
                    alt="Avatar Preview"
                    className="w-full h-full"
                  />
                </div>

                <div className="w-full space-y-4">
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">
                      Estilo
                    </label>
                    <select
                      className="w-full p-2 border rounded text-sm"
                      value={authData.avatarStyle}
                      onChange={(e) =>
                        setAuthData({
                          ...authData,
                          avatarStyle: e.target.value,
                        })
                      }
                    >
                      <option value="adventurer">Aventureiro (Novo)</option>
                      <option value="micah">Artístico (Novo)</option>
                      <option value="notionists">Notion (Novo)</option>
                      <option value="avataaars">Clássico</option>
                      <option value="bottts">Robô</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">
                      Variação (Nome)
                    </label>
                    <input
                      type="text"
                      className="w-full p-2 border rounded text-sm"
                      placeholder="Digite para mudar..."
                      value={authData.avatarSeed}
                      onChange={(e) =>
                        setAuthData({ ...authData, avatarSeed: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase block mb-1">
                      Cor de Fundo
                    </label>
                    <div className="flex gap-2 justify-center">
                      {["b6e3f4", "c0aede", "d1d4f9", "ffdfbf", "ffd5dc"].map(
                        (color) => (
                          <button
                            key={color}
                            onClick={() =>
                              setAuthData({ ...authData, avatarBg: color })
                            }
                            className={`w-6 h-6 rounded-full border ${authData.avatarBg === color ? "border-black ring-1 ring-black" : "border-gray-300"}`}
                            style={{ backgroundColor: `#${color}` }}
                          />
                        ),
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <form
                onSubmit={handleRegister}
                className="w-full md:w-2/3 p-8 space-y-4 overflow-y-auto"
              >
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="checkbox"
                    id="isPsy"
                    className="w-4 h-4 accent-[#0E4768]"
                    checked={authData.isPsychologist}
                    onChange={(e) =>
                      setAuthData({
                        ...authData,
                        isPsychologist: e.target.checked,
                      })
                    }
                  />
                  <label
                    htmlFor="isPsy"
                    className="text-sm font-bold text-[#0E4768] cursor-pointer"
                  >
                    Sou Psicólogo(a)
                  </label>
                </div>

                {authData.isPsychologist ? (
                  <div className="bg-teal-50 p-4 rounded-lg border border-teal-200 space-y-3 animate-in fade-in">
                    <p className="text-xs text-teal-800 font-bold">
                      Dados Profissionais
                    </p>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase">
                        Nome Completo
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full border rounded p-2"
                        value={authData.alias}
                        onChange={(e) =>
                          setAuthData({ ...authData, alias: e.target.value })
                        }
                        placeholder="Ex: Dr. João Silva"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">
                          CRP
                        </label>
                        <input
                          type="text"
                          required
                          className="w-full border rounded p-2"
                          value={authData.crp}
                          onChange={(e) =>
                            setAuthData({ ...authData, crp: e.target.value })
                          }
                          placeholder="00/00000"
                        />
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">
                          Link do Perfil
                        </label>
                        <input
                          type="url"
                          required
                          className="w-full border rounded p-2"
                          value={authData.profileLink}
                          onChange={(e) =>
                            setAuthData({
                              ...authData,
                              profileLink: e.target.value,
                            })
                          }
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase">
                        Como quer ser chamado? *
                      </label>
                      <input
                        type="text"
                        required
                        className="w-full border rounded p-2"
                        placeholder="Apelido Anônimo"
                        value={authData.alias}
                        onChange={(e) =>
                          setAuthData({ ...authData, alias: e.target.value })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase">
                        Idade (Opcional)
                      </label>
                      <input
                        type="number"
                        className="w-full border rounded p-2"
                        placeholder="Anos"
                        value={authData.age}
                        onChange={(e) =>
                          setAuthData({ ...authData, age: e.target.value })
                        }
                      />
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    Telefone (Login/Contato) *
                  </label>
                  <input
                    type="tel"
                    required
                    className="w-full border rounded p-2"
                    placeholder="DDD + WhatsApp"
                    value={authData.phone}
                    onChange={(e) =>
                      setAuthData({ ...authData, phone: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-500 uppercase">
                    Crie uma Senha *
                  </label>
                  <input
                    type="password"
                    required
                    className="w-full border rounded p-2"
                    placeholder="******"
                    value={authData.password}
                    onChange={(e) =>
                      setAuthData({ ...authData, password: e.target.value })
                    }
                  />
                </div>
                {!authData.isPsychologist && (
                  <div>
                    <label className="text-xs font-bold text-gray-500 uppercase">
                      Breve Relato (O que te traz aqui?)
                    </label>
                    <textarea
                      className="w-full border rounded p-2 h-20"
                      placeholder="Resuma o que tem sentido..."
                      value={authData.history}
                      onChange={(e) =>
                        setAuthData({ ...authData, history: e.target.value })
                      }
                    ></textarea>
                  </div>
                )}
                <button
                  type="submit"
                  className="w-full bg-[#A83E6C] text-white font-bold py-3 rounded-lg hover:bg-[#862A5C] mt-4 shadow-lg"
                >
                  Finalizar Cadastro
                </button>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Login */}
      {isLoginModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 relative">
            <button
              onClick={() => setIsLoginModalOpen(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
            <h2 className="text-xl font-bold text-[#0E4768] mb-6 flex items-center gap-2">
              <LogIn className="w-5 h-5" /> Acesso
            </h2>
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">
                  Seu Telefone
                </label>
                <input
                  type="tel"
                  required
                  className="w-full border rounded p-2 focus:border-[#228DB0] outline-none"
                  placeholder="O mesmo do cadastro"
                  value={authData.phone}
                  onChange={(e) =>
                    setAuthData({ ...authData, phone: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">
                  Sua Senha
                </label>
                <input
                  type="password"
                  required
                  className="w-full border rounded p-2 focus:border-[#228DB0] outline-none"
                  placeholder="******"
                  value={authData.password}
                  onChange={(e) =>
                    setAuthData({ ...authData, password: e.target.value })
                  }
                />
              </div>
              <button
                type="submit"
                className="w-full bg-[#0E4768] text-white font-bold py-3 rounded-lg hover:bg-[#09334C]"
              >
                Entrar no Meu Espaço
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Painel do Usuário */}
      {isDashboardOpen && currentUserProfile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl h-[80vh] flex flex-col relative overflow-hidden">
            <div className="bg-[#0E4768] px-6 py-4 flex justify-between items-center text-white flex-shrink-0">
              <div className="flex items-center gap-3">
                <img
                  src={currentUserProfile.avatarUrl}
                  className="w-10 h-10 rounded-full bg-white border-2 border-white"
                  alt="Avatar"
                />
                <div>
                  <span className="font-bold block leading-tight">
                    {currentUserProfile.alias}
                  </span>
                  <span className="text-[10px] opacity-80 font-normal">
                    {currentUserProfile.isPsychologist
                      ? `Psicólogo(a)`
                      : "Painel do Paciente"}
                  </span>
                </div>
              </div>
              <button onClick={() => setIsDashboardOpen(false)}>
                <X className="w-6 h-6 hover:text-red-300" />
              </button>
            </div>

            <div className="flex border-b border-gray-200 bg-gray-50">
              {!currentUserProfile.isPsychologist && (
                <button
                  onClick={() => setActiveTab("request")}
                  className={`flex-1 py-3 font-bold text-xs sm:text-sm uppercase tracking-wide transition-colors ${activeTab === "request" ? "text-[#0E4768] border-b-4 border-[#0E4768] bg-white" : "text-gray-400 hover:text-gray-600"}`}
                >
                  Pedir Ajuda Profissional
                </button>
              )}
              <button
                onClick={() => setActiveTab("thought")}
                className={`flex-1 py-3 font-bold text-xs sm:text-sm uppercase tracking-wide transition-colors ${activeTab === "thought" ? "text-[#A83E6C] border-b-4 border-[#A83E6C] bg-white" : "text-gray-400 hover:text-gray-600"}`}
              >
                {currentUserProfile.isPsychologist
                  ? "Publicar no Feed"
                  : "Desabafar no Diário"}
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-grow bg-white">
              {activeTab === "request" && !currentUserProfile.isPsychologist ? (
                <div className="max-w-lg mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4">
                  <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex items-start gap-3">
                    <Shield className="w-5 h-5 text-[#0E4768] flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-[#0E4768]">
                      Ao publicar aqui, psicólogos cadastrados poderão ver sua
                      queixa e orçamento. Seu telefone será revelado apenas para
                      eles.
                    </p>
                  </div>
                  <form onSubmit={handlePostRequest} className="space-y-4">
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase">
                        Título do Pedido *
                      </label>
                      <input
                        type="text"
                        className="w-full border rounded p-2"
                        placeholder="Ex: Ansiedade no trabalho"
                        value={requestForm.title}
                        onChange={(e) =>
                          setRequestForm({
                            ...requestForm,
                            title: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase">
                        Descrição Detalhada *
                      </label>
                      <textarea
                        className="w-full border rounded p-2 h-24"
                        placeholder="Conte mais sobre o que precisa..."
                        value={requestForm.description}
                        onChange={(e) =>
                          setRequestForm({
                            ...requestForm,
                            description: e.target.value,
                          })
                        }
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">
                          Urgência
                        </label>
                        <select
                          className="w-full border rounded p-2 bg-white"
                          value={requestForm.urgency}
                          onChange={(e) =>
                            setRequestForm({
                              ...requestForm,
                              urgency: e.target.value,
                            })
                          }
                        >
                          <option value="normal">Normal</option>
                          <option value="urgente">Urgente</option>
                        </select>
                      </div>
                      <div>
                        <label className="text-xs font-bold text-gray-500 uppercase">
                          Máx. por Sessão (R$)
                        </label>
                        <input
                          type="number"
                          className="w-full border rounded p-2"
                          placeholder="Ex: 80"
                          value={requestForm.sessionBudget}
                          onChange={(e) =>
                            setRequestForm({
                              ...requestForm,
                              sessionBudget: e.target.value,
                            })
                          }
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-bold text-gray-500 uppercase">
                        Máx. Mensal (R$)
                      </label>
                      <input
                        type="number"
                        className="w-full border rounded p-2"
                        placeholder="Ex: 320"
                        value={requestForm.monthlyBudget}
                        onChange={(e) =>
                          setRequestForm({
                            ...requestForm,
                            monthlyBudget: e.target.value,
                          })
                        }
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full bg-[#0E4768] text-white font-bold py-3 rounded-lg hover:bg-[#09334C] shadow-lg"
                    >
                      Publicar Pedido de Ajuda
                    </button>
                  </form>
                </div>
              ) : (
                <div className="max-w-lg mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4">
                  <div className="bg-pink-50 p-4 rounded-xl border border-pink-100 flex items-start gap-3">
                    <PenTool className="w-5 h-5 text-[#A83E6C] flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-[#A83E6C]">
                      {currentUserProfile.isPsychologist
                        ? "Compartilhe dicas e pensamentos."
                        : "Escreva o que está sentindo. Isso aparecerá no Diário Compartilhado anonimamente."}
                    </p>
                  </div>
                  <form onSubmit={handlePostThought}>
                    <textarea
                      className="w-full border-2 border-gray-200 rounded-xl p-4 h-48 focus:border-[#A83E6C] outline-none resize-none text-gray-700 leading-relaxed"
                      placeholder="Como você está se sentindo hoje?"
                      value={thoughtForm}
                      onChange={(e) => setThoughtForm(e.target.value)}
                    ></textarea>
                    <button
                      type="submit"
                      className="w-full bg-[#A83E6C] text-white font-bold py-3 rounded-lg hover:bg-[#862A5C] shadow-lg mt-4"
                    >
                      Publicar
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
