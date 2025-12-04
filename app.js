// ===== API CONFIGURATION =====
// Note: API is optional. The app works fully client-side without a backend.
// Authentication features will fail gracefully if API is not available.
// All core reading features work as a guest user with browser localStorage.
const API_URL = "http://localhost:4000/api";

// ===== AUTH HELPERS =====
function saveToken(token) {
  try {
    localStorage.setItem("token", token);
  } catch (e) {
    console.warn("Could not save token to localStorage:", e);
  }
}

function getToken() {
  try {
    return localStorage.getItem("token");
  } catch (e) {
    console.warn("Could not access localStorage:", e);
    return null;
  }
}

function removeToken() {
  try {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  } catch (e) {
    console.warn("Could not remove from localStorage:", e);
  }
}

function saveUser(user) {
  try {
    localStorage.setItem("user", JSON.stringify(user));
  } catch (e) {
    console.warn("Could not save user to localStorage:", e);
  }
}

function getUser() {
  try {
    const userData = localStorage.getItem("user");
    return userData ? JSON.parse(userData) : null;
  } catch (e) {
    console.warn("Could not access localStorage:", e);
    return null;
  }
}

function parseJwt(token) {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(c => {
      return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

function getCurrentUser() {
  const token = getToken();
  if (!token) return null;
  return parseJwt(token);
}

function isLoggedIn() {
  // Everyone is a guest with full access - no authentication required
  return true;
}

// ===== API CALLS =====
async function apiCall(endpoint, options = {}) {
  const token = getToken();
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  const response = await fetch(`${API_URL}${endpoint}`, {
    ...options,
    headers
  });
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(error.error || error.message || 'Request failed');
  }
  
  return response.json();
}

async function register(username, email, password) {
  console.log("Registering with:", { username, email, password: "***" });
  const res = await fetch(`${API_URL}/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password })
  });
  const data = await res.json();
  console.log("Register response:", { ok: res.ok, status: res.status, data });
  if (!res.ok) {
    throw new Error(data.error || data.message || "Registration failed");
  }
  localStorage.setItem("token", data.token);
  if (data.user) {
    saveUser(data.user);
    state.plan = data.user.plan || "free";
    saveState();
  }
  console.log("Registration successful, saved user:", data.user);
  return data;
}

async function login(email, password) {
  console.log("Logging in with:", { email, password: "***" });
  const res = await fetch(`${API_URL}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password })
  });
  const data = await res.json();
  console.log("Login response:", { ok: res.ok, status: res.status, data });
  if (!res.ok) {
    throw new Error(data.error || data.message || "Login failed");
  }
  localStorage.setItem("token", data.token);
  if (data.user) {
    saveUser(data.user);
    state.plan = data.user.plan || "free";
    saveState();
  }
  console.log("Login successful, saved user:", data.user);
  return data;
}

async function logout() {
  removeToken();
  state.plan = "free";
  saveState();
  updateAuthUI();
  renderRightPanel();
  showToast("Logged out successfully");
}

async function upgradeToPremium() {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/subscription/upgrade`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    }
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Upgrade failed");
  }
  localStorage.setItem("token", data.token);
  if (data.user) {
    saveUser(data.user);
    state.plan = data.user.plan;
  }
  saveState();
  updateAuthUI();
  renderRightPanel();
  showToast("🎉 Upgraded to Premium!");
  launchConfetti();
  checkAchievement('premium');
  return data;
}

async function downgradePlan() {
  const token = localStorage.getItem("token");
  const res = await fetch(`${API_URL}/subscription/downgrade`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: "Bearer " + token
    }
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data.error || "Downgrade failed");
  }
  localStorage.setItem("token", data.token);
  if (data.user) {
    saveUser(data.user);
    state.plan = data.user.plan;
  }
  saveState();
  updateAuthUI();
  renderRightPanel();
  showToast("Downgraded to Free plan");
  return data;
}

// ===== DUMMY DATA =====
const books = [
  {
    id: "astro-1",
    title: "Astrophysics for Busy People",
    author: "Neil deGrasse Tyson",
    genre: "Science",
    genres: ["Science", "Astronomy", "Physics", "Popular Science"],
    rating: 4.8,
    pages: 40,
    cover: "https://images-na.ssl-images-amazon.com/images/I/41MiT-A7sNL._SX331_BO1,204,203,200_.jpg",
    format: "pdf",
    fileUrl: "books/astro.pdf",
    downloadFormats: [
      { format: "pdf", url: "books/astro.pdf" },
      { format: "epub", url: "books/astro.epub" }
    ],
    publisher: "W. W. Norton & Company",
    publishDate: "May 2, 2017",
    isbn: "978-0393609394",
    language: "English",
    samplePages: 8,
    synopsis: "What is the nature of space and time? How do we fit within the universe? How does the universe fit within us? There's no better guide through these mind-expanding questions than acclaimed astrophysicist and best-selling author Neil deGrasse Tyson. But today, few of us have time to contemplate the cosmos. So Tyson brings the universe down to Earth succinctly and clearly, with sparkling wit, in digestible chapters consumable anytime and anywhere in your busy day.",
    sampleText:
      "Chapter 1: A Brief Tour of the Cosmos.\n\nSpace is unimaginably vast, but we can break it into pieces our brains can handle. Imagine standing on a balcony that looks out over the entire universe..."
  },
  {
    id: "bottle-1",
    title: "Bottle Rocket",
    author: "Kenna King",
    genre: "Romance",
    genres: ["Romance", "Sports Romance", "Contemporary Romance", "Hockey Romance"],
    rating: 4.3,
    pages: 279,
    cover: "https://m.media-amazon.com/images/I/71VQ+mN7jrL._SY522_.jpg",
    format: "pdf",
    fileUrl: "books/bottle-rocket.pdf",
    downloadFormats: [
      { format: "pdf", url: "books/bottle-rocket.pdf" },
      { format: "epub", url: "books/bottle-rocket.epub" }
    ],
    publisher: "Self-Published",
    publishDate: "October 15, 2023",
    isbn: "978-1234567890",
    language: "English",
    samplePages: 10,
    synopsis: "In this heartfelt, slow-burn hockey romance, a runaway bride and a grumpy hockey star learn that both family and love can be found in the most unexpected places. When Everly flees her wedding, she never expects to land in the home of Cole Matthews, the NHL's most notorious bad boy. As they navigate their unlikely connection, both must confront their pasts and decide if they're brave enough to open their hearts to a future together.",
    sampleText:
      "In this heartfelt, slow-burn hockey romance, a runaway bride and a grumpy hockey star learn that both family and love can be found in the most unexpected places."
  },
  {
    id: "classic-1",
    title: "Middlemarch",
    author: "George Eliot",
    genre: "Classic",
    genres: ["Classic Literature", "Victorian Literature", "Historical Fiction", "Literary Fiction"],
    rating: 4.6,
    pages: 880,
    cover: "icons/middlemarch-cover.jpg",
    format: "pdf",
    fileUrl: "books/middlemarch.pdf",
    downloadFormats: [
      { format: "pdf", url: "books/middlemarch.pdf" }
    ],
    publisher: "William Blackwood and Sons",
    publishDate: "1871-1872",
    isbn: "978-0141196893",
    language: "English",
    samplePages: 10,
    synopsis: "Set in the fictitious Midlands town of Middlemarch during 1829-1832, this masterpiece by George Eliot explores the complex web of relationships in a provincial community. The novel centers on the lives of idealistic Dorothea Brooke, who yearns to make a meaningful contribution to society, and ambitious Dr. Tertius Lydgate, who seeks to reform medical practice. Through their stories and those of the town's other residents, Eliot examines themes of marriage, politics, religion, hypocrisy, and social reform with psychological depth and moral complexity. Often considered one of the greatest novels in the English language.",
    sampleText:
      "Middlemarch is George Eliot's masterpiece - a panoramic tale of life in a provincial English town during the 1830s. Following the intersecting lives of Dorothea Brooke, an idealistic young woman, and the ambitious Dr. Lydgate, the novel explores themes of marriage, ambition, reform, and the constraints of society with psychological depth and social insight."
  },
  {
    id: "lotr-1",
    title: "The Lord of the Rings",
    author: "J.R.R. Tolkien",
    genre: "Fantasy",
    genres: ["Fantasy", "Classic Literature", "Adventure", "Epic Fantasy"],
    rating: 4.54,
    pages: 1341,
    cover: "icons/lotr-cover.jpg",
    format: "pdf",
    fileUrl: "books/lotr.pdf",
    downloadFormats: [
      { format: "pdf", url: "books/lotr.pdf" },
      { format: "epub", url: "books/lotr.epub" }
    ],
    publishDate: "1954-1955",
    isbn: "978-0544003415",
    language: "English",
    samplePages: 15,
    synopsis: "The Lord of the Rings is an epic high fantasy trilogy written by J.R.R. Tolkien. Set in the fictional world of Middle-earth, the story follows hobbit Frodo Baggins as he and the Fellowship embark on a quest to destroy the One Ring and defeat the Dark Lord Sauron. This masterpiece of imaginative literature combines adventure, mythology, and timeless themes of friendship, courage, and the struggle between good and evil. Often considered one of the greatest fantasy works ever written, it has influenced countless authors and captivated millions of readers worldwide.",
    sampleText:
      "When Mr. Bilbo Baggins of Bag End announced that he would shortly be celebrating his eleventy-first birthday with a party of special magnificence, there was much talk and excitement in Hobbiton..."
  },
  {
    id: "jungle-1",
    title: "O Livro da Selva",
    author: "Rudyard Kipling",
    genre: "Classic",
    genres: ["Classic Literature", "Adventure", "Children's Literature", "Fiction"],
    rating: 4.7,
    pages: 395,
    cover: "icons/jungle-book-cover.jpg",
    format: "pdf",
    fileUrl: "books/jungle-book.pdf",
    downloadFormats: [
      { format: "pdf", url: "books/jungle-book.pdf" },
      { format: "epub", url: "books/jungle-book.epub" }
    ],
    publishDate: "2018",
    isbn: "N/A",
    language: "Portuguese",
    samplePages: 10,
    synopsis: "O Livro da Selva é uma coleção de histórias escritas por Rudyard Kipling. A história principal segue as aventuras de Mowgli, um menino criado por lobos na selva indiana. Junto com seus amigos Baloo o urso, Bagheera a pantera negra, e outros animais da selva, Mowgli aprende as leis da selva enquanto enfrenta perigos como o tigre Shere Khan. Uma obra clássica cheia de aventura, amizade e lições sobre a natureza e a sobrevivência. Edição em domínio público no Brasil, publicada pelo Instituto Mojo.",
    sampleText: "Mowgli, o filhote humano, foi criado pelos lobos nas profundezas da selva indiana..."
  },
  {
    id: "clockwork-1",
    title: "A Clockwork Orange",
    author: "Anthony Burgess",
    genre: "Classics",
    genres: ["Classics", "Fiction", "Science Fiction", "Dystopia", "Horror", "Literature", "Novels"],
    rating: 4.0,
    pages: 331,
    cover: "icons/clockwork-orange-cover.jpg",
    format: "epub",
    fileUrl: "books/a-clockwork-orange.epub",
    downloadFormats: [
      { format: "epub", url: "books/a-clockwork-orange.epub" },
      { format: "pdf", url: "books/clockwork-orange.pdf" }
    ],
    publishDate: "January 1, 1962",
    isbn: "978-0393312836",
    language: "English",
    samplePages: 15,
    synopsis: "In Anthony Burgess's influential nightmare vision of the future, criminals take over after dark. Teen gang leader Alex narrates in fantastically inventive slang that echoes the violent intensity of youth rebelling against society. Dazzling and transgressive, A Clockwork Orange is a frightening fable about good and evil and the meaning of human freedom. This edition includes the controversial last chapter not published in the first edition, and Burgess's introduction, 'A Clockwork Orange Resucked.'",
    sampleText: "There was me, that is Alex, and my three droogs, that is Pete, Georgie, and Dim, and we sat in the Korova Milkbar trying to make up our rassoodocks what to do with the evening..."
  }
];

// ===== USER IDENTIFICATION =====
// Generate a unique user ID for this browser/device
function getUserId() {
  let userId = localStorage.getItem('readworld_user_id');
  if (!userId) {
    // Generate a unique ID: timestamp + random string
    userId = 'user_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    localStorage.setItem('readworld_user_id', userId);
  }
  return userId;
}

// ===== STATE KEYS =====
// Each user gets their own storage key based on their unique ID
function getStorageKey() {
  return `readworld_state_${getUserId()}`;
}

const STORAGE_KEY = getStorageKey();

let state = {
  plan: "free", // "free" or "premium"
  userName: "", // User's display name for reviews
  progress: {}, // bookId -> {page}
  favorites: [], // [bookId]
  reviews: {}, // bookId -> {text, name, date}
  userRatings: {}, // bookId -> rating (1-5)
  recent: [], // bookId[]
  savedThisMonth: 0,
  savedMonthKey: "", // "YYYY-MM"
  downloadsThisMonth: 0,
  downloadMonthKey: "", // "YYYY-MM"
  annotations: {}, // bookId -> { bookmarks: [{page, note, timestamp}], highlights: [{page, text, color}], notes: [{page, text}] }
  achievements: {}, // achievementId -> {earned: boolean, date: timestamp}
  streak: 0,
  lastReadDate: null,
  readingMinutesToday: 0,
  booksFinished: 0,
  reviewsWritten: 0,
  accessibility: {
    fontSize: 16,
    theme: 'light',
    highContrast: false,
    dyslexicFont: false,
    reducedMotion: false,
    screenReader: false,
    zoom: 1.0
  },
  preferences: {
    autoSave: true,
    showRecommendations: true,
    showDailyQuote: true
  }
};

function loadState() {
  const storageKey = getStorageKey();
  const raw = localStorage.getItem(storageKey);
  if (raw) {
    try {
      state = { ...state, ...JSON.parse(raw) };
    } catch (e) {
      console.error("Failed to parse state", e);
    }
  }

  // Initialize accessibility settings if they don't exist
  if (!state.accessibility) {
    state.accessibility = {
      darkMode: false,
      colorBlind: false,
      theme: 'light',
      zoom: 1.0
    };
  }

  // Initialize preferences if they don't exist
  if (!state.preferences) {
    state.preferences = {
      autoSave: true,
      showAI: true,
      showRecommendations: true,
      showDailyQuote: true
    };
  }

  // reset monthly counters if month changed
  const nowKey = new Date().toISOString().slice(0, 7);
  if (state.savedMonthKey !== nowKey) {
    state.savedMonthKey = nowKey;
    state.savedThisMonth = 0;
  }
  if (state.downloadMonthKey !== nowKey) {
    state.downloadMonthKey = nowKey;
    state.downloadsThisMonth = 0;
  }
  saveState();
}

function saveState() {
  try {
    const storageKey = getStorageKey();
    localStorage.setItem(storageKey, JSON.stringify(state));
  } catch (e) {
    console.warn("Could not save state:", e.message);
  }
}

// ===== UI HELPERS =====
const $ = (id) => document.getElementById(id);

function showToast(message) {
  const toast = $("toast");
  toast.textContent = message;
  toast.classList.remove("hidden");
  setTimeout(() => toast.classList.add("hidden"), 7000);
}

// genres
function getGenres() {
  const set = new Set();
  books.forEach((b) => set.add(b.genre));
  return Array.from(set).sort();
}

// ===== READER STATE =====
let currentBook = null;
let currentPage = 1;
let currentPdfPage = 1;
let isSampleMode = false; // Sample mode disabled - full access for everyone

// PDF.js objects
let pdfDoc = null;
let pdfTotalPages = 0;

// EPUB.js objects
let epubBook = null;
let epubRendition = null;
let epubCurrentLocation = null;

// ===== RENDERING =====
let currentGenreFilter = null;
let currentSearch = "";
let currentSort = "default";
let advancedFilters = {
  genres: [],
  ratings: [],
  formats: [],
  languages: []
};

function renderGenres() {
  const list = $("genreList");
  list.innerHTML = "";

  const allLi = document.createElement("li");
  allLi.textContent = "All";
  allLi.classList.add("active");
  allLi.addEventListener("click", () => {
    currentGenreFilter = null;
    updateGenreActive(allLi);
    renderBooks();
  });
  list.appendChild(allLi);

  for (const g of getGenres()) {
    const li = document.createElement("li");
    li.textContent = g;
    li.addEventListener("click", () => {
      currentGenreFilter = g;
      updateGenreActive(li);
      renderBooks();
    });
    list.appendChild(li);
  }
}

function updateGenreActive(activeLi) {
  document.querySelectorAll(".genre-list li").forEach((li) => {
    li.classList.toggle("active", li === activeLi);
  });
}

function renderBooks() {
  const grid = $("bookGrid");
  grid.innerHTML = "";

  const onlyFav = $("onlyFavoritesCheckbox").checked;
  const onlyProg = $("onlyInProgressCheckbox").checked;

  let filtered = books.filter((b) => {
    if (currentGenreFilter && b.genre !== currentGenreFilter) return false;
    if (currentSearch) {
      const s = currentSearch.toLowerCase();
      if (
        !b.title.toLowerCase().includes(s) &&
        !b.author.toLowerCase().includes(s)
      )
        return false;
    }
    if (onlyFav && !state.favorites.includes(b.id)) return false;
    if (onlyProg && !state.progress[b.id]) return false;
    
    // Advanced filters
    if (advancedFilters.genres.length > 0 && !advancedFilters.genres.includes(b.genre)) return false;
    if (advancedFilters.formats.length > 0 && !advancedFilters.formats.includes(b.format)) return false;
    if (advancedFilters.languages.length > 0) {
      const bookLang = b.language || 'English';
      if (!advancedFilters.languages.includes(bookLang)) return false;
    }
    if (advancedFilters.ratings.length > 0) {
      const hasMatchingRating = advancedFilters.ratings.some(range => 
        b.rating >= range.min && b.rating <= range.max
      );
      if (!hasMatchingRating) return false;
    }
    
    return true;
  });
  
  // Apply sorting
  if (currentSort === "recent") {
    // Sort by date added (reverse order, newest first) - using array index as proxy
    filtered = [...filtered].reverse();
  } else if (currentSort === "rating") {
    filtered = [...filtered].sort((a, b) => b.rating - a.rating);
  }

  $("bookSectionTitle").textContent = currentGenreFilter || "All Books";
  $("bookCount").textContent = `${filtered.length} book(s)`;

  filtered.forEach((book) => {
    const card = document.createElement("article");
    card.className = "book-card";
    card.dataset.bookId = book.id;
    card.setAttribute("role", "button");
    card.setAttribute("aria-label", `Open book ${book.title} by ${book.author}`);
    card.setAttribute("tabindex", "0");

    const cover = document.createElement("div");
    cover.className = "book-cover";
    
    // Always use the cover image if available
    if (book.cover) {
      const img = document.createElement("img");
      img.src = book.cover;
      img.alt = `${book.title} cover`;
      img.style.width = "100%";
      img.style.height = "100%";
      img.style.objectFit = "cover";
      cover.appendChild(img);
    } else {
      // Fallback to text initials if no cover
      cover.textContent = book.title
        .split(" ")
        .slice(0, 2)
        .map((w) => w[0])
        .join("")
        .toUpperCase();
    }
    card.appendChild(cover);

    const title = document.createElement("div");
    title.className = "book-title";
    title.textContent = book.title;
    card.appendChild(title);

    const author = document.createElement("div");
    author.className = "book-author";
    author.textContent = `by ${book.author}`;
    card.appendChild(author);

    // Add language badge for non-English books
    if (book.language && book.language !== "English") {
      const langBadge = document.createElement("div");
      langBadge.className = "language-badge";
      langBadge.textContent = book.language;
      card.appendChild(langBadge);
    }

    const meta = document.createElement("div");
    meta.className = "book-meta";
    const ratingSpan = document.createElement("span");
    ratingSpan.textContent = `⭐ ${book.rating.toFixed(1)}`;
    const pagesSpan = document.createElement("span");
    const prog = state.progress[book.id]?.page || 0;
    if (prog > 0) {
      pagesSpan.textContent = `Page ${prog}/${book.pages}`;
    } else {
      pagesSpan.textContent = `${book.pages} pages`;
    }
    meta.appendChild(ratingSpan);
    meta.appendChild(pagesSpan);
    card.appendChild(meta);

    const genreTag = document.createElement("span");
    genreTag.className = "book-tag";
    genreTag.textContent = book.genre;
    card.appendChild(genreTag);

    const actions = document.createElement("div");
    actions.className = "book-actions";

    const readBtn = document.createElement("button");
    readBtn.textContent = "Read";
    readBtn.classList.add("primary-btn");
    readBtn.addEventListener("click", () => openReader(book.id));
    actions.appendChild(readBtn);

    const favBtn = document.createElement("button");
    favBtn.className = "favorite-btn";
    favBtn.textContent = state.favorites.includes(book.id)
      ? "★ Favorited"
      : "☆ Favorite";
    favBtn.addEventListener("click", () => toggleFavorite(book.id));
    actions.appendChild(favBtn);

    // Download buttons - show both PDF and EPUB options
    if (book.downloadFormats && book.downloadFormats.length > 0) {
      book.downloadFormats.forEach(formatOption => {
        const downloadBtn = document.createElement("button");
        downloadBtn.textContent = `📥 ${formatOption.format.toUpperCase()}`;
        downloadBtn.className = "book-download-btn";
        downloadBtn.title = `Download as ${formatOption.format.toUpperCase()}`;
        downloadBtn.addEventListener("click", () => {
          downloadBookFormat(book.id, formatOption.format, formatOption.url);
        });
        actions.appendChild(downloadBtn);
      });
    } else {
      // Fallback for books without downloadFormats defined
      const downloadBtn = document.createElement("button");
      downloadBtn.textContent = "Download";
      downloadBtn.className = "book-download-btn";
      downloadBtn.addEventListener("click", () => {
        downloadBook(book.id);
      });
      actions.appendChild(downloadBtn);
    }

    card.appendChild(actions);

    grid.appendChild(card);
  });

  renderRightPanel();
}

function renderRightPanel() {
  const user = getUser();
  const loggedIn = isLoggedIn();
  
  // Show different content for guests vs logged-in users
  if (!loggedIn) {
    renderGuestPanel();
    return;
  }
  
  // Update statistics (unlimited for everyone)
  $("statSaved").textContent = state.savedThisMonth || 0;
  $("statDownloads").textContent = state.downloadsThisMonth || 0;
  $("statFavorites").textContent = state.favorites.length;

  // Favorites
  const favList = $("favoriteList");
  favList.innerHTML = "";
  if (state.favorites.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No favorites yet";
    li.className = "muted";
    favList.appendChild(li);
  } else {
    state.favorites.forEach((id) => {
      const book = books.find((b) => b.id === id);
      if (!book) return;
      const li = document.createElement("li");
      li.textContent = book.title;
      li.style.cursor = "pointer";
      li.addEventListener("click", () => openReader(id));
      favList.appendChild(li);
    });
  }

  // Recent
  const recentList = $("recentList");
  recentList.innerHTML = "";
  if (state.recent.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No recent books";
    li.className = "muted";
    recentList.appendChild(li);
  } else {
    state.recent.slice(0, 6).forEach((id) => {
      const book = books.find((b) => b.id === id);
      if (!book) return;
      const li = document.createElement("li");
      li.textContent = book.title;
      li.style.cursor = "pointer";
      li.addEventListener("click", () => openReader(id));
      recentList.appendChild(li);
    });
  }
  
  // Progress list
  const progressList = $("progressList");
  progressList.innerHTML = "";
  const booksInProgress = Object.keys(state.progress);
  if (booksInProgress.length === 0) {
    const li = document.createElement("li");
    li.textContent = "No books in progress";
    li.className = "muted";
    progressList.appendChild(li);
  } else {
    booksInProgress.forEach((id) => {
      const book = books.find((b) => b.id === id);
      if (!book) return;
      const li = document.createElement("li");
      const progress = state.progress[id];
      const percent = Math.round((progress.page / book.pages) * 100);
      li.textContent = `${book.title} (${percent}%)`;
      li.style.cursor = "pointer";
      li.addEventListener("click", () => openReader(id));
      progressList.appendChild(li);
    });
  }
  
}

function renderGuestPanel() {
  // Hide all member-only sections and show guest message
  const activityTab = $("activityTab");
  const settingsTab = $("settingsTab");
  
  // All features available to everyone - no restrictions
  activityTab.innerHTML = `
    <div class="guest-message">
      <div class="guest-icon">📚</div>
      <h3>Welcome to ReadWorld!</h3>
      <p class="muted">All features are available:</p>
      <ul class="guest-features-list">
        <li>🏆 Achievement tracking & badges</li>
        <li>🔥 Reading streak & progress</li>
        <li>📊 Detailed statistics</li>
        <li>❤️ Favorites & bookmarks</li>
        <li>📚 Reading history</li>
        <li>📝 Book reviews</li>
        <li>✨ Highlights & notes</li>
        <li>📖 Full book access</li>
      </ul>
    </div>
  `;
  
  // All settings available to everyone
  settingsTab.innerHTML = `
    <div class="guest-message">
      <div class="guest-icon">⚙️</div>
      <h3>Settings</h3>
      <p class="muted">All settings are available.</p>
      
      <div class="settings-section">
        <h3>Accessibility</h3>
        <div class="setting-item">
          <label class="checkbox-row full-width">
            <input type="checkbox" id="highContrastMode" />
            <span>High Contrast Mode</span>
          </label>
        </div>
        <div class="setting-item">
          <label class="checkbox-row full-width">
            <input type="checkbox" id="screenReaderMode" />
            <span>Enhanced Screen Reader Support</span>
          </label>
        </div>
      </div>
    </div>
  `;
  
  // Sync accessibility checkboxes
  setTimeout(() => {
    const highContrastCheckbox = $('highContrastMode');
    const screenReaderCheckbox = $('screenReaderMode');
    
    if (highContrastCheckbox) {
      highContrastCheckbox.checked = state.accessibility.highContrast || false;
      highContrastCheckbox.addEventListener("change", (e) => {
        state.accessibility.highContrast = e.target.checked;
        saveState();
        applyAccessibilitySettings();
        showToast(e.target.checked ? "High contrast enabled" : "High contrast disabled");
      });
    }
    
    if (screenReaderCheckbox) {
      screenReaderCheckbox.checked = state.accessibility.screenReader || false;
      screenReaderCheckbox.addEventListener("change", (e) => {
        state.accessibility.screenReader = e.target.checked;
        saveState();
        showToast(e.target.checked ? "Screen reader mode enabled" : "Screen reader mode disabled");
      });
    }
    
    // Guest buttons now use inline onclick handlers
  }, 100);
}

// ===== FAVORITES =====
function toggleFavorite(bookId) {
  const wasFavorited = state.favorites.includes(bookId);
  
  if (wasFavorited) {
    state.favorites = state.favorites.filter((id) => id !== bookId);
    showToast("Removed from favorites");
  } else {
    state.favorites.push(bookId);
    showToast("Added to favorites");
  }
  saveState();
  
  // Update only the specific button text, don't re-render everything
  updateFavoriteButton(bookId, !wasFavorited);
  renderRightPanel(); // Update sidebar stats only
}

function updateFavoriteButton(bookId, isFavorited) {
  // Find all favorite buttons for this book and update them
  const bookCards = document.querySelectorAll('.book-card');
  bookCards.forEach(card => {
    if (card.dataset.bookId === bookId) {
      const favBtn = card.querySelector('.favorite-btn');
      if (favBtn) {
        favBtn.textContent = isFavorited ? "★ Favorited" : "☆ Favorite";
      }
    }
  });
}

// ===== ANNOTATIONS =====
let selectedHighlightColor = null;

function getAnnotations(bookId) {
  if (!state.annotations[bookId]) {
    state.annotations[bookId] = {
      bookmarks: [], // Array of {page, note, timestamp}
      highlights: [],
      notes: []
    };
  }
  return state.annotations[bookId];
}

function addBookmark(bookId, page, note = '') {
  const annotations = getAnnotations(bookId);
  const existingIndex = annotations.bookmarks.findIndex(b => b.page === page);
  
  if (existingIndex === -1) {
    // Add new bookmark
    annotations.bookmarks.push({
      page: page,
      note: note,
      timestamp: Date.now()
    });
    annotations.bookmarks.sort((a, b) => a.page - b.page);
    saveState();
    renderAnnotations();
    updateBookmarkButton();
  } else if (note) {
    // Update existing bookmark's note
    annotations.bookmarks[existingIndex].note = note;
    saveState();
    renderAnnotations();
  }
}

function removeBookmark(bookId, page) {
  const annotations = getAnnotations(bookId);
  annotations.bookmarks = annotations.bookmarks.filter(b => b.page !== page);
  saveState();
  renderAnnotations();
  updateBookmarkButton();
}

window.toggleBookmark = function toggleBookmark() {
  console.log('🔖 toggleBookmark called');
  console.log('currentBook:', currentBook);
  console.log('currentPage:', currentPage);
  
  if (!currentBook) {
    alert('⚠️ Please open a book first!');
    return;
  }
  
  const page = currentPage;
  
  // Initialize bookmarks array if it doesn't exist
  if (!state.annotations[currentBook.id]) {
    state.annotations[currentBook.id] = {
      bookmarks: [],
      highlights: [],
      notes: []
    };
  }
  
  // Get current bookmarks array
  let bookmarks = state.annotations[currentBook.id].bookmarks;
  
  // Check if this page is already bookmarked
  const bookmarkIndex = bookmarks.findIndex(b => b.page === page);
  
  if (bookmarkIndex !== -1) {
    // Remove bookmark - page is already bookmarked
    bookmarks.splice(bookmarkIndex, 1);
  } else {
    // Add bookmark - new bookmark
    bookmarks.push({
      page: page,
      note: '',
      timestamp: Date.now()
    });
    // Sort bookmarks by page number
    bookmarks.sort((a, b) => a.page - b.page);
  }
  
  // Save to localStorage
  localStorage.setItem("readworld_bookmarks", JSON.stringify(state.annotations));
  saveState();
  
  // Update UI
  renderAnnotations();
  updateBookmarkButton();
};

// ===== QUICK NOTE FUNCTIONS =====
window.showQuickNoteBox = function showQuickNoteBox() {
  console.log('📝 showQuickNoteBox called');
  console.log('currentBook:', currentBook);
  
  if (!currentBook) {
    alert('⚠️ Please open a book first!');
    return;
  }
  
  const noteBox = $("quickNoteBox");
  const noteInput = $("quickNoteInput");
  
  // Check if there's an existing note for this page
  const page = currentPage;
  const annotations = getAnnotations(currentBook.id);
  const existingNote = annotations.notes.find(n => n.page === page);
  
  if (existingNote) {
    noteInput.value = existingNote.text;
  } else {
    noteInput.value = '';
  }
  
  noteBox.classList.remove("hidden");
  noteInput.focus();
}

window.hideQuickNoteBox = function hideQuickNoteBox() {
  const noteBox = $("quickNoteBox");
  const noteInput = $("quickNoteInput");
  noteBox.classList.add("hidden");
  noteInput.value = '';
}

window.saveQuickNote = function saveQuickNote() {
  try {
    console.log('📝 saveQuickNote called');
    console.log('currentBook:', currentBook);
    console.log('currentPage:', currentPage);
    
    if (!currentBook) {
      alert('ERROR: No book open!');
      return;
    }
    
    const noteInput = $("quickNoteInput");
    console.log('noteInput element:', noteInput);
    
    if (!noteInput) {
      alert('ERROR: Note input not found!');
      return;
    }
    
    const noteText = noteInput.value.trim();
    console.log('Note text:', noteText);
    
    if (!noteText) {
      alert('Please write a note first!');
      window.hideQuickNoteBox();
      return;
    }
    
    const page = currentPage;
    console.log('Saving note for page:', page);
    
    // Initialize annotations if needed
    if (!state.annotations[currentBook.id]) {
      state.annotations[currentBook.id] = {
        bookmarks: [],
        highlights: [],
        notes: []
      };
    }
    
    const annotations = state.annotations[currentBook.id];
    console.log('Current notes before save:', annotations.notes);
    
    // Check if note already exists for this page
    const existingNoteIndex = annotations.notes.findIndex(n => n.page === page);
    
    if (existingNoteIndex !== -1) {
      // Update existing note
      annotations.notes[existingNoteIndex].text = noteText;
      annotations.notes[existingNoteIndex].timestamp = Date.now();
      console.log('✅ Updated existing note');
    } else {
      // Add new note
      annotations.notes.push({
        page: page,
        text: noteText,
        timestamp: Date.now()
      });
      annotations.notes.sort((a, b) => a.page - b.page);
      console.log('✅ Added new note');
    }
    
    console.log('Notes after save:', annotations.notes);
    
    saveState();
    console.log('State saved to localStorage');
    
    renderAnnotations();
    console.log('Annotations rendered');
    
    window.hideQuickNoteBox();
    console.log('Note box hidden');
    
    showToast('✅ Note saved!');
  } catch (error) {
    console.error('❌ ERROR in saveQuickNote:', error);
    showToast('❌ Error saving note');
  }
};

function updateBookmarkButton() {
  const btn = $("addBookmarkBtn");
  if (!btn || !currentBook) return;
  
  // Use same page logic as toggleBookmark and saveProgress
  const page = currentPage;
  
  if (!state.annotations[currentBook.id]) {
    state.annotations[currentBook.id] = {
      bookmarks: [],
      highlights: [],
      notes: []
    };
  }
  
  const bookmarks = state.annotations[currentBook.id].bookmarks;
  const bookmark = bookmarks.find(b => b.page === page);
  const isBookmarked = !!bookmark;
  
  if (isBookmarked) {
    btn.classList.add("bookmarked");
    btn.innerHTML = "✅ Bookmarked";
    btn.title = "Remove bookmark";
  } else {
    btn.classList.remove("bookmarked");
    btn.innerHTML = "🔖 Bookmark";
    btn.title = "Bookmark this page";
  }
}

function addHighlight(bookId, page, text, color) {
  const annotations = getAnnotations(bookId);
  annotations.highlights.push({ page, text, color, timestamp: Date.now() });
  saveState();
  renderAnnotations();
  showToast(`✨ Text highlighted in ${color}`);
}

function removeHighlight(bookId, index) {
  const annotations = getAnnotations(bookId);
  annotations.highlights.splice(index, 1);
  saveState();
  renderAnnotations();
  showToast("Highlight removed");
}

function addNote(bookId, page, text) {
  const annotations = getAnnotations(bookId);
  annotations.notes.push({ page, text, timestamp: Date.now() });
  saveState();
  renderAnnotations();
  showToast(`📝 Note added to page ${page}`);
}

function removeNote(bookId, index) {
  const annotations = getAnnotations(bookId);
  annotations.notes.splice(index, 1);
  saveState();
  renderAnnotations();
  showToast("Note removed");
}

// ===== RATING DISTRIBUTION & REVIEWS =====
function renderRatingDistribution(book) {
  // Collect all ratings for this book
  const ratings = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  
  // Add user's rating if they have one
  const userRating = state.userRatings ? state.userRatings[book.id] : 0;
  if (userRating > 0 && userRating <= 5) {
    ratings[userRating]++;
  }
  
  // Calculate total ratings
  const totalRatings = ratings[5] + ratings[4] + ratings[3] + ratings[2] + ratings[1];
  
  // Update the rating bars
  for (let star = 5; star >= 1; star--) {
    const count = ratings[star];
    const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
    $(`rating${star}Bar`).style.width = `${percentage}%`;
    $(`rating${star}Count`).textContent = count.toString();
  }
  
  // Update the book's overall rating display if there are ratings
  if (totalRatings > 0) {
    const totalScore = (ratings[5] * 5) + (ratings[4] * 4) + (ratings[3] * 3) + (ratings[2] * 2) + (ratings[1] * 1);
    const avgRating = totalScore / totalRatings;
    $("readerRating").textContent = `Book Rating: ⭐ ${avgRating.toFixed(1)} (${totalRatings} rating${totalRatings > 1 ? 's' : ''})`;
  } else {
    $("readerRating").textContent = `Book Rating: ⭐ ${book.rating.toFixed(1)} (No user ratings yet)`;
  }
}

function renderUserReviews(book, showPreview = false) {
  const reviewsList = $("userReviewsList");
  reviewsList.innerHTML = '';
  
  // Check if user has written a review for this book
  const userReview = state.reviews[book.id];
  const userRating = state.userRatings ? state.userRatings[book.id] : 0;
  
  // Show user's review if it exists
  if (userReview || userRating > 0) {
    const reviewItem = document.createElement('div');
    reviewItem.className = 'review-item';
    reviewItem.style.border = '2px solid #3b82f6';
    reviewItem.style.backgroundColor = '#eff6ff';
    reviewItem.style.position = 'relative';
    
    const stars = userRating > 0 ? ('★'.repeat(userRating) + '☆'.repeat(5 - userRating)) : '';
    
    // Handle both old format (string) and new format (object)
    const reviewText = typeof userReview === 'string' ? userReview : (userReview?.text || '');
    const reviewName = typeof userReview === 'string' ? 'You' : (userReview?.name || 'You');
    const reviewDate = typeof userReview === 'string' ? new Date().toLocaleDateString() : 
      (userReview?.date ? new Date(userReview.date).toLocaleDateString() : new Date().toLocaleDateString());
    
    reviewItem.innerHTML = `
      <div class="review-header">
        <div class="review-user-info">
          <span class="review-username">${reviewName}</span>
          ${stars ? `<div class="review-rating">${stars}</div>` : ''}
        </div>
        <button class="delete-review-btn" title="Delete your review">🗑️</button>
      </div>
      ${reviewText ? `<p class="review-text">${reviewText}</p>` : ''}
      <p class="review-date">${reviewDate}</p>
    `;
    reviewsList.appendChild(reviewItem);
    
    // Add delete functionality
    const deleteBtn = reviewItem.querySelector('.delete-review-btn');
    deleteBtn.addEventListener('click', () => {
      if (confirm('Are you sure you want to delete your review?')) {
        deleteUserReview(book.id);
      }
    });
  }
  
  // Show mock reviews if preview is enabled
  if (showPreview) {
    const mockReviews = generateMockReviews(book);
    mockReviews.forEach(review => {
      const reviewItem = document.createElement('div');
      reviewItem.className = 'review-item';
      
      const stars = '★'.repeat(review.rating) + '☆'.repeat(5 - review.rating);
      
      reviewItem.innerHTML = `
        <div class="review-header">
          <span class="review-username">${review.username}</span>
          <span class="review-rating">${stars}</span>
        </div>
        <p class="review-text">${review.text}</p>
        <p class="review-date">${review.date}</p>
      `;
      reviewsList.appendChild(reviewItem);
    });
  }
  
  // Show "no reviews" message only if there are no reviews at all
  if (reviewsList.children.length === 0) {
    reviewsList.innerHTML = '<p class="muted">No reviews yet. Be the first to review!</p>';
  }
}

function generateMockReviews(book) {
  const usernames = ['BookLover42', 'ReadingQueen', 'LitFan99', 'PageTurner', 'NovelAddict', 'StorySeeker', 'BibliophileJoe', 'ChapterChaser'];
  const reviewTexts = [
    'Absolutely loved this book! Couldn\'t put it down.',
    'A masterpiece. Highly recommend to anyone who enjoys this genre.',
    'Great story with compelling characters. Worth the read.',
    'Good book, but felt a bit slow in parts.',
    'Not my favorite, but it had some interesting moments.',
    'Beautifully written. The author\'s style is captivating.',
    'This book changed my perspective. A must-read!',
    'Enjoyable read with unexpected twists.',
  ];
  
  const reviewCount = Math.floor(Math.random() * 5) + 3; // 3-7 reviews
  const reviews = [];
  
  for (let i = 0; i < reviewCount; i++) {
    const rating = Math.floor(book.rating) + (Math.random() > 0.5 ? 1 : 0);
    const finalRating = Math.min(5, Math.max(1, rating));
    
    reviews.push({
      username: usernames[Math.floor(Math.random() * usernames.length)],
      rating: finalRating,
      text: reviewTexts[Math.floor(Math.random() * reviewTexts.length)],
      date: generateRandomDate()
    });
  }
  
  return reviews;
}

function generateRandomDate() {
  const daysAgo = Math.floor(Math.random() * 180); // 0-180 days ago
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Star rating input handler
let selectedUserRating = 0;

function initStarRating() {
  const starBtns = document.querySelectorAll('.star-btn');
  const starContainer = document.querySelector('.star-rating-input');
  
  if (!starBtns.length || !starContainer) {
    console.warn('Star rating elements not found');
    return;
  }
  
  starBtns.forEach((btn, index) => {
    btn.addEventListener('click', () => {
      // Everyone can rate books
      selectedUserRating = index + 1;
      updateStarDisplay();
    });
    
    btn.addEventListener('mouseenter', () => {
      highlightStars(index + 1);
    });
  });
  
  starContainer.addEventListener('mouseleave', () => {
    updateStarDisplay();
  });
}

function highlightStars(count) {
  const starBtns = document.querySelectorAll('.star-btn');
  starBtns.forEach((btn, index) => {
    btn.textContent = index < count ? '★' : '☆';
  });
}

function updateStarDisplay() {
  highlightStars(selectedUserRating);
}

function renderAnnotations() {
  if (!currentBook) return;
  
  const annotations = getAnnotations(currentBook.id);
  
  // Bookmarks
  const bookmarksList = $("bookmarksList");
  bookmarksList.innerHTML = "";
  if (annotations.bookmarks.length === 0) {
    const li = document.createElement("li");
    li.className = "muted";
    li.textContent = "No bookmarks yet. Click the 🔖 Bookmark button to add one!";
    bookmarksList.appendChild(li);
  } else {
    annotations.bookmarks.forEach(bookmark => {
      const li = document.createElement("li");
      li.style.cssText = "cursor: pointer; padding: 8px; margin-bottom: 6px; background: #f9fafb; border-radius: 6px; position: relative;";
      
      let content = `<div style="font-weight: 500; color: #1e40af;">🔖 Page ${bookmark.page}</div>`;
      if (bookmark.note) {
        content += `<div style="font-size: 0.85em; color: #6b7280; margin-top: 4px; font-style: italic;">"${bookmark.note}"</div>`;
      }
      content += `<div style="font-size: 0.75em; color: #9ca3af; margin-top: 4px;">${new Date(bookmark.timestamp).toLocaleDateString()}</div>`;
      
      li.innerHTML = content;
      
      li.addEventListener("click", (e) => {
        if (e.target.closest('.delete-bookmark-btn')) return;
        
        if (pdfDoc) {
          currentPage = bookmark.page;
          currentPdfPage = bookmark.page;
          renderPdfPage(bookmark.page);
          showToast(`📖 Jumped to page ${bookmark.page}`);
          // Switch to reader view
          $("annotationsTab").classList.remove("active");
          $("infoTab").classList.add("active");
          $("annotationsTabContent").classList.add("hidden");
          $("infoTabContent").classList.remove("hidden");
        } else if (epubBook) {
          showToast(`📖 Bookmark for page ${bookmark.page}`);
        }
      });
      
      const deleteBtn = document.createElement("span");
      deleteBtn.className = "delete-bookmark-btn";
      deleteBtn.textContent = "✕";
      deleteBtn.style.cssText = "position: absolute; top: 8px; right: 8px; color: #ef4444; cursor: pointer; font-weight: bold; padding: 2px 6px; border-radius: 4px; background: white;";
      deleteBtn.title = "Remove bookmark";
      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        removeBookmark(currentBook.id, bookmark.page);
      });
      li.appendChild(deleteBtn);
      bookmarksList.appendChild(li);
    });
  }
  
  // Highlights (removed from UI, skip rendering)
  const highlightsList = $("highlightsList");
  if (highlightsList) {
    highlightsList.innerHTML = "";
    if (annotations.highlights.length === 0) {
      const li = document.createElement("li");
      li.className = "muted";
      li.textContent = "No highlights yet";
      highlightsList.appendChild(li);
    } else {
      annotations.highlights.forEach((highlight, index) => {
        const li = document.createElement("li");
        li.style.cursor = "pointer";
        li.innerHTML = `
          <div>Page ${highlight.page}</div>
          <div class="highlight-preview highlight-${highlight.color}">${highlight.text.substring(0, 50)}${highlight.text.length > 50 ? '...' : ''}</div>
        `;
        
        // Click to jump to page
        li.addEventListener("click", (e) => {
          if (e.target.tagName !== 'SPAN') {
            if (pdfDoc) {
              currentPage = highlight.page;
              currentPdfPage = highlight.page;
              renderPdfPage(highlight.page);
              showToast(`Jumped to page ${highlight.page}`);
              // Switch to reader view
              $("annotationsTab").classList.remove("active");
              $("infoTab").classList.add("active");
              $("annotationsTabContent").classList.add("hidden");
              $("infoTabContent").classList.remove("hidden");
            }
          }
        });
        
        const deleteBtn = document.createElement("span");
        deleteBtn.textContent = " ✕";
        deleteBtn.style.cssText = "color: #ef4444; cursor: pointer; float: right; margin-top: -20px;";
        deleteBtn.addEventListener("click", (e) => {
          e.stopPropagation();
          removeHighlight(currentBookId, index);
        });
        li.appendChild(deleteBtn);
        highlightsList.appendChild(li);
      });
    }
  }
  
  // Notes
  const notesList = $("notesList");
  notesList.innerHTML = "";
  if (annotations.notes.length === 0) {
    const li = document.createElement("li");
    li.className = "muted";
    li.textContent = "No notes yet";
    notesList.appendChild(li);
  } else {
    annotations.notes.forEach((note, index) => {
      const li = document.createElement("li");
      li.style.cssText = "cursor: pointer; padding: 8px; margin-bottom: 8px; background: #f9fafb; border-radius: 6px; position: relative; border-left: 3px solid #8b5cf6;";
      li.innerHTML = `
        <div style="font-weight: 500; color: #7c3aed; margin-bottom: 4px;">📝 Page ${note.page}</div>
        <div style="color: #374151; line-height: 1.5;">${note.text}</div>
        <div style="font-size: 0.75em; color: #9ca3af; margin-top: 4px;">${new Date(note.timestamp).toLocaleDateString()}</div>
      `;
      
      // Click to jump to page
      li.addEventListener("click", (e) => {
        if (e.target.tagName !== 'SPAN') {
          if (pdfDoc) {
            currentPage = note.page;
            currentPdfPage = note.page;
            renderPdfPage(note.page);
            showToast(`Jumped to page ${note.page}`);
            // Switch to reader view
            $("annotationsTab").classList.remove("active");
            $("infoTab").classList.add("active");
            $("annotationsTabContent").classList.add("hidden");
            $("infoTabContent").classList.remove("hidden");
          }
        }
      });
      
      const deleteBtn = document.createElement("span");
      deleteBtn.textContent = "✕";
      deleteBtn.style.cssText = "position: absolute; top: 8px; right: 8px; color: #ef4444; cursor: pointer; font-weight: bold; padding: 2px 6px; border-radius: 4px; background: white; font-size: 14px;";
      deleteBtn.title = "Delete note";
      deleteBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        removeNote(currentBook.id, index);
      });
      li.appendChild(deleteBtn);
      notesList.appendChild(li);
    });
  }
}

// ===== ACHIEVEMENTS & GAMIFICATION =====
const ACHIEVEMENTS = {
  firstSave: { id: 'firstSave', name: 'First Save', desc: 'Save your first book', icon: '📚', trigger: 1 },
  streak7: { id: 'streak7', name: '7-Day Streak', desc: 'Read 7 days in a row', icon: '🔥', trigger: 7 },
  bookFinished: { id: 'bookFinished', name: 'Book Worm', desc: 'Finish your first book', icon: '🏆', trigger: 1 },
  reviews10: { id: 'reviews10', name: 'Critic', desc: 'Write 10 reviews', icon: '✍️', trigger: 10 },
  reading30min: { id: 'reading30min', name: 'Dedicated Reader', desc: '30 minutes in one day', icon: '⏰', trigger: 30 },
  premium: { id: 'premium', name: 'Premium Member', desc: 'Upgrade to Premium', icon: '⭐', trigger: 1 }
};

function checkAchievement(achievementId) {
  const achievement = ACHIEVEMENTS[achievementId];
  if (!achievement || state.achievements[achievementId]?.earned) return;
  
  let earned = false;
  
  switch(achievementId) {
    case 'firstSave':
      earned = Object.keys(state.progress).length >= 1;
      break;
    case 'streak7':
      earned = state.streak >= 7;
      break;
    case 'bookFinished':
      earned = state.booksFinished >= 1;
      break;
    case 'reviews10':
      earned = state.reviewsWritten >= 10;
      break;
    case 'reading30min':
      earned = state.readingMinutesToday >= 30;
      break;
    case 'premium':
      earned = state.plan === 'premium';
      break;
  }
  
  if (earned && !state.achievements[achievementId]) {
    state.achievements[achievementId] = { earned: true, date: Date.now() };
    saveState();
    showToast(`🏆 Achievement Unlocked: ${achievement.name}!`);
    launchConfetti();
    renderAchievements();
  }
}

function checkAllAchievements() {
  Object.keys(ACHIEVEMENTS).forEach(id => checkAchievement(id));
}

function renderAchievements() {
  const list = $('achievementsList');
  list.innerHTML = '';
  
  Object.values(ACHIEVEMENTS).forEach(achievement => {
    const earned = state.achievements[achievement.id]?.earned;
    const badge = document.createElement('div');
    badge.className = `achievement-badge ${earned ? 'earned' : 'locked'}`;
    badge.innerHTML = `
      <div class="achievement-icon">${achievement.icon}</div>
      <div class="achievement-name">${achievement.name}</div>
      <div class="achievement-desc">${achievement.desc}</div>
    `;
    list.appendChild(badge);
  });
}

function updateStreak() {
  const today = new Date().toDateString();
  const lastRead = state.lastReadDate ? new Date(state.lastReadDate).toDateString() : null;
  
  if (lastRead === today) {
    // Already read today
    return;
  }
  
  const yesterday = new Date(Date.now() - 86400000).toDateString();
  
  if (lastRead === yesterday) {
    // Continue streak
    state.streak += 1;
  } else if (lastRead !== today) {
    // Streak broken or first read
    state.streak = 1;
  }
  
  state.lastReadDate = Date.now();
  state.readingMinutesToday = 0;
  saveState();
  checkAchievement('streak7');
  renderStreak();
}

function renderStreak() {
  $('streakNumber').textContent = state.streak || 0;
}

// ===== DAILY QUOTE =====
const QUOTES = [
  { text: "A reader lives a thousand lives before he dies.", author: "George R.R. Martin" },
  { text: "Books are a uniquely portable magic.", author: "Stephen King" },
  { text: "There is no friend as loyal as a book.", author: "Ernest Hemingway" },
  { text: "Reading is essential for those who seek to rise above the ordinary.", author: "Jim Rohn" },
  { text: "A book is a dream that you hold in your hand.", author: "Neil Gaiman" },
  { text: "The reading of all good books is like a conversation with the finest minds of past centuries.", author: "René Descartes" },
  { text: "You can never get a cup of tea large enough or a book long enough to suit me.", author: "C.S. Lewis" }
];

function showDailyQuote() {
  const lastQuoteDate = localStorage.getItem('lastQuoteDate');
  const today = new Date().toDateString();
  
  if (lastQuoteDate === today) return; // Already shown today
  
  const quote = QUOTES[Math.floor(Math.random() * QUOTES.length)];
  $('dailyQuoteText').textContent = `"${quote.text}"`;
  $('dailyQuoteAuthor').textContent = `— ${quote.author}`;
  $('quoteModal').classList.remove('hidden');
  
  localStorage.setItem('lastQuoteDate', today);
}

// ===== CONFETTI ANIMATION =====
function launchConfetti() {
  const canvas = $('confettiCanvas');
  const ctx = canvas.getContext('2d');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  
  const particles = [];
  const colors = ['#fbbf24', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#3b82f6', '#10b981'];
  
  for (let i = 0; i < 100; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height - canvas.height,
      size: Math.random() * 8 + 4,
      speedY: Math.random() * 3 + 2,
      speedX: Math.random() * 4 - 2,
      color: colors[Math.floor(Math.random() * colors.length)],
      rotation: Math.random() * 360,
      rotationSpeed: Math.random() * 10 - 5
    });
  }
  
  function animate() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    let active = false;
    
    particles.forEach(p => {
      p.y += p.speedY;
      p.x += p.speedX;
      p.rotation += p.rotationSpeed;
      
      if (p.y < canvas.height) {
        active = true;
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rotation * Math.PI / 180);
        ctx.fillStyle = p.color;
        ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
        ctx.restore();
      }
    });
    
    if (active) {
      requestAnimationFrame(animate);
    } else {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }
  
  animate();
}

// ===== RECOMMENDATIONS =====
function generateRecommendations() {
  if (!currentBook || !currentBook.id) return [];
  
  const current = currentBook;
  if (!currentBook) return [];
  
  // Simple recommendation: same genre, different book
  const sameGenre = books.filter(b => b.genre === current.genre && b.id !== current.id);
  const trending = books.filter(b => b.rating >= 4.7);
  
  return {
    becauseYouLiked: sameGenre.slice(0, 2),
    trending: trending.slice(0, 2)
  };
}

function showRecommendations() {
  // Widget now shows chat interface instead of book recommendations
  // Chat interface is built into HTML
}

function populateAITab() {
  // AI tab now focuses on chat interface, no static list needed
  // Users will get recommendations through the AI chat
}

// AI Chat functionality with troubleshooting context
let aiChatContext = {
  lastTopic: null,
  troubleshootingLevel: 0,
  lastSolution: null
};

function addChatMessage(message, isUser = false) {
  const chatMessages = $('aiChatMessages');
  const messageDiv = document.createElement('div');
  messageDiv.style.cssText = `
    margin-bottom: 12px;
    padding: 10px 12px;
    border-radius: 8px;
    ${isUser ? 'background: #9333ea; color: white; margin-left: 20%; text-align: right;' : 'background: white; color: #1f2937; margin-right: 20%; border: 1px solid #e5e7eb;'}
  `;
  messageDiv.innerHTML = `<div style="font-size: 0.9rem;">${message}</div>`;
  chatMessages.appendChild(messageDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function getAIResponse(userQuestion) {
  try {
    let question = userQuestion.toLowerCase().trim();
    
    // Fix common misspellings and typos to improve understanding
    const misspellings = {
      'dowload': 'download',
      'donwload': 'download',
      'downlod': 'download',
      'downlaod': 'download',
      'highlite': 'highlight',
      'hilight': 'highlight',
      'highlght': 'highlight',
      'recomend': 'recommend',
      'reccomend': 'recommend',
      'recomendation': 'recommendation',
      'recomendations': 'recommendations',
      'recomnd': 'recommend',
      'doesnt': 'doesn\'t',
      'dosent': 'doesn\'t',
      'dosen\'t': 'doesn\'t',
      'dont': 'don\'t',
      'didnt': 'didn\'t',
      'dident': 'didn\'t',
      'wont': 'won\'t',
      'wouldnt': 'wouldn\'t',
      'cant': 'can\'t',
      'cannt': 'can\'t',
      'hlep': 'help',
      'halp': 'help',
      'wrk': 'work',
      'workin': 'working',
      'werk': 'work',
      'opne': 'open',
      'ope': 'open',
      'favourit': 'favorite',
      'favorit': 'favorite',
      'favrite': 'favorite',
      'progres': 'progress',
      'progess': 'progress',
      'progrss': 'progress',
      'prolbem': 'problem',
      'probem': 'problem',
      'problm': 'problem',
      'isue': 'issue',
      'isseu': 'issue',
      'stil': 'still',
      'stil': 'still',
      'stll': 'still',
      'brok': 'broken',
      'borken': 'broken',
      'boken': 'broken',
      'savd': 'saved',
      'sve': 'save',
      'sav': 'save',
      'trak': 'track',
      'traking': 'tracking',
      'trakking': 'tracking',
      'nots': 'notes',
      'ntoes': 'notes',
      'ntes': 'notes',
      'raed': 'read',
      'rd': 'read',
      'buk': 'book',
      'bok': 'book',
      'boook': 'book',
      'librayr': 'library',
      'libary': 'library',
      'librry': 'library',
      'serch': 'search',
      'seach': 'search',
      'searh': 'search',
      'finde': 'find',
      'loking': 'looking',
      'lookng': 'looking',
      'reeding': 'reading',
      'readng': 'reading'
    };
    
    // Apply spelling corrections
    Object.keys(misspellings).forEach(wrong => {
      const regex = new RegExp('\\b' + wrong + '\\b', 'gi');
      question = question.replace(regex, misspellings[wrong]);
    });
  
  // Specific book queries
  if (question.includes('clockwork orange') || question.includes('a clockwork orange')) {
    const book = books.find(b => b.title.toLowerCase().includes('clockwork orange'));
    if (book) return `A Clockwork Orange by Anthony Burgess is a ${book.rating} star dystopian classic! It's ${book.pages} pages of thought-provoking fiction about free will and morality. Want me to open it for you? 📕`;
  }
  if (question.includes('lord of the rings') || question.includes('lotr')) {
    const book = books.find(b => b.title.toLowerCase().includes('lord of the rings'));
    if (book) return `The Lord of the Rings by J.R.R. Tolkien is an epic ${book.pages}-page fantasy adventure! Rated ${book.rating} stars. Perfect for fans of adventure and mythology. 🧙‍♂️`;
  }
  if (question.includes('middlemarch')) {
    const book = books.find(b => b.title.toLowerCase().includes('middlemarch'));
    if (book) return `Middlemarch by George Eliot is a ${book.pages}-page classic literature masterpiece! Rated ${book.rating} stars. A profound exploration of Victorian society. 📚`;
  }
  
  // Book recommendations - enhanced with multiple options
  if (question.includes('recommend') || question.includes('suggest') || question.includes('what should i read') || question.includes('need a book') || question.includes('want a book') || question.includes('looking for a book') || (question.includes('book') && (question.includes('good') || question.includes('best')))) {
    try {
      const recs = generateRecommendations();
      if (recs.becauseYouLiked.length > 0 && recs.trending.length > 0) {
        return `Based on your reading, I recommend:\n\n1️⃣ "${recs.becauseYouLiked[0].title}" by ${recs.becauseYouLiked[0].author} (⭐${recs.becauseYouLiked[0].rating})\n2️⃣ "${recs.trending[0].title}" by ${recs.trending[0].author} (⭐${recs.trending[0].rating})\n\nBoth are highly rated and match your interests! 📚`;
      }
      if (recs.becauseYouLiked.length > 0) {
        return `Based on your reading history, I recommend "${recs.becauseYouLiked[0].title}" by ${recs.becauseYouLiked[0].author}. It's a ${recs.becauseYouLiked[0].genre} book with a ${recs.becauseYouLiked[0].rating} star rating! 📚`;
      }
      // Always show top books from library
      const topBooks = [...books].sort((a, b) => b.rating - a.rating).slice(0, 3);
      return `Here are our top-rated books:\n\n${topBooks.map((b, i) => `${i+1}️⃣ "${b.title}" by ${b.author} (⭐${b.rating})`).join('\n')}\n\nAll excellent choices! 🌟`;
    } catch (error) {
      console.error('Error generating recommendations:', error);
      // Fallback: show message only, books appear as bubbles
      return `Here are our top-rated books from the library:`;
    }
  }
  
  // Library browsing
  if (question.includes('how many books') || question.includes('book count') || question.includes('library') || question.includes('browse')) {
    return `Our library has ${books.length} amazing books across multiple genres! We have Classics, Science Fiction, Fantasy, Romance, and more. Check the main page to browse all books! 📖`;
  }
  
  // Search/Find specific genres
  if (question.includes('dystopia') || question.includes('dystopian')) {
    const dystopianBooks = books.filter(b => b.genres.some(g => g.toLowerCase().includes('dystopia')));
    if (dystopianBooks.length > 0) {
      return `We have ${dystopianBooks.length} dystopian book(s): ${dystopianBooks.map(b => `"${b.title}"`).join(', ')}. Click the Dystopia genre filter to see them! 🌆`;
    }
  }
  if (question.includes('fantasy')) {
    const fantasyBooks = books.filter(b => b.genres.some(g => g.toLowerCase().includes('fantasy')));
    if (fantasyBooks.length > 0) {
      return `We have ${fantasyBooks.length} fantasy book(s): ${fantasyBooks.map(b => `"${b.title}"`).join(', ')}. Perfect for epic adventures! 🐉`;
    }
  }
  if (question.includes('classic')) {
    const classicBooks = books.filter(b => b.genres.some(g => g.toLowerCase().includes('classic')));
    if (classicBooks.length > 0) {
      return `We have ${classicBooks.length} classic literature book(s): ${classicBooks.map(b => `"${b.title}"`).join(', ')}. Timeless masterpieces! 📜`;
    }
  }
  if (question.includes('romance')) {
    const romanceBooks = books.filter(b => b.genres.some(g => g.toLowerCase().includes('romance')));
    if (romanceBooks.length > 0) {
      const bookList = romanceBooks.map(b => `"${b.title}" by ${b.author} (⭐${b.rating})`).join('\n');
      return `Perfect! We have ${romanceBooks.length} romance book(s):\n\n${bookList}\n\nAll great love stories! 💕`;
    } else {
      return `We don't currently have romance books in our collection, but we're always adding new titles! Check back soon or try another genre like Fiction or Classic Literature! 📚`;
    }
  }
  if (question.includes('science fiction') || question.includes('sci-fi') || question.includes('scifi')) {
    const scifiBooks = books.filter(b => b.genres.some(g => g.toLowerCase().includes('science fiction')));
    if (scifiBooks.length > 0) {
      const bookList = scifiBooks.map(b => `"${b.title}" by ${b.author} (⭐${b.rating})`).join('\n');
      return `Awesome! We have ${scifiBooks.length} science fiction book(s):\n\n${bookList}\n\nExplore amazing futuristic worlds! 🚀`;
    }
  }
  if (question.includes('horror')) {
    const horrorBooks = books.filter(b => b.genres.some(g => g.toLowerCase().includes('horror')));
    if (horrorBooks.length > 0) {
      const bookList = horrorBooks.map(b => `"${b.title}" by ${b.author} (⭐${b.rating})`).join('\n');
      return `Feeling brave? We have ${horrorBooks.length} horror book(s):\n\n${bookList}\n\nPrepare for some chills! 😱`;
    }
  }
  
  // Features - Highlighting
  if (question.includes('highlight')) {
    aiChatContext.lastTopic = 'highlight';
    aiChatContext.troubleshootingLevel = 1;
    aiChatContext.lastSolution = 'basic-steps';
    return `To highlight text:\n1️⃣ Open any book\n2️⃣ Select the text you want to highlight\n3️⃣ Choose a color from the popup\n4️⃣ Your highlights are auto-saved!\n\nYou can also add notes to highlights. Try it now! 🖍️\n\nIf highlights aren't working, let me know and I'll help troubleshoot! 🔧`;
  }
  
  // Features - Notes
  if (question.includes('note') && !question.includes('highlight')) {
    aiChatContext.lastTopic = 'notes';
    aiChatContext.troubleshootingLevel = 1;
    aiChatContext.lastSolution = 'basic-steps';
    return `To add notes:\n1️⃣ Highlight some text first\n2️⃣ Click the note icon 📝\n3️⃣ Type your thoughts\n4️⃣ Notes are saved automatically!\n\nView all notes in the reader's Notes tab. 📓\n\nHaving trouble? Let me know and I'll help! 🔧`;
  }
  
  // Follow-up troubleshooting - detect when solutions didn't work
  if (question.includes('doesn\'t work') || 
      question.includes('doesnt work') ||
      question.includes('not working') || 
      question.includes('didnt work') ||
      question.includes('didn\'t work') ||
      question.includes('tried that') || 
      question.includes('same problem') || 
      question.includes('still broken') ||
      question.includes('doesn\'t help') ||
      question.includes('doesnt help') ||
      (question.includes('still') && (question.includes('not') || question.includes('doesn\'t') || question.includes('doesnt') || question.includes('wont') || question.includes('won\'t')))) {
    
    if (aiChatContext.lastTopic === 'download') {
      aiChatContext.troubleshootingLevel++;
      
      if (aiChatContext.troubleshootingLevel === 2) {
        aiChatContext.lastSolution = 'browser-settings';
        return `Let's try advanced solutions! 🔧\n\n**Check Browser Settings:**\n1️⃣ Make sure pop-ups are allowed:\n   • Chrome: chrome://settings/content/popups\n   • Firefox: about:preferences#privacy\n   • Edge: edge://settings/content/popups\n\n2️⃣ Check download settings:\n   • Verify download location exists\n   • Make sure "Ask where to save" is enabled\n\n3️⃣ Try clearing browser cache:\n   • Ctrl+Shift+Delete → Clear browsing data\n\nDid any of these help? 🤔`;
      } else if (aiChatContext.troubleshootingLevel === 3) {
        aiChatContext.lastSolution = 'alternative-methods';
        return `Let's try alternative methods! 🎯\n\n**Option 1: Right-Click Method**\n• Right-click the download button\n• Select "Save Link As..."\n• Choose your download location\n\n**Option 2: Different Browser**\n• Try Chrome, Firefox, or Edge\n• Sometimes one browser works better\n\n**Option 3: Disable Extensions**\n• Ad blockers can interfere\n• Try disabling temporarily\n\n**Option 4: Check Storage**\n• Make sure you have disk space\n• Try a different download folder\n\nLet me know which works! 🌟`;
      } else if (aiChatContext.troubleshootingLevel >= 4) {
        aiChatContext.lastSolution = 'advanced-debugging';
        return `Advanced debugging steps! 🛠️\n\n**Check Console for Errors:**\n1️⃣ Press F12 to open developer tools\n2️⃣ Go to Console tab\n3️⃣ Try downloading again\n4️⃣ Look for red error messages\n\n**Possible Issues:**\n• Network/firewall blocking downloads\n• VPN/proxy interference\n• Browser security settings too strict\n• Corrupted browser profile\n\n**Last Resort:**\n• Try incognito/private mode\n• Reset browser settings\n• Update your browser to latest version\n\nStill stuck? Tell me what error you see! 🔍`;
      }
    } else if (aiChatContext.lastTopic === 'highlight') {
      aiChatContext.troubleshootingLevel++;
      
      if (aiChatContext.troubleshootingLevel === 2) {
        aiChatContext.lastSolution = 'browser-check';
        return `Let's troubleshoot highlights! 🔧\n\n**Common Issues:**\n1️⃣ Make sure you're selecting text properly:\n   • Click and drag to select\n   • Don't just click once\n   • Select at least a few words\n\n2️⃣ Check if JavaScript is enabled:\n   • Highlights require JavaScript\n   • Check browser settings\n\n3️⃣ Try refreshing the page:\n   • Ctrl+F5 for hard refresh\n   • Reopen the book\n\nDoes highlighting work now? 🖍️`;
      } else if (aiChatContext.troubleshootingLevel >= 3) {
        aiChatContext.lastSolution = 'storage-check';
        return `Advanced highlight troubleshooting! 🛠️\n\n**Check Browser Storage:**\n1️⃣ Make sure localStorage is enabled:\n   • Check browser privacy settings\n   • Highlights are saved locally\n\n2️⃣ Clear old data and try again:\n   • Browser settings → Clear site data\n   • Reload and test highlights\n\n3️⃣ Try a different browser:\n   • Chrome, Firefox, or Edge\n   • Test if highlights work there\n\n4️⃣ Check console for errors:\n   • Press F12\n   • Look for red errors when highlighting\n\nLet me know what you find! 🔍`;
      }
    } else if (aiChatContext.lastTopic === 'notes') {
      aiChatContext.troubleshootingLevel++;
      
      if (aiChatContext.troubleshootingLevel === 2) {
        aiChatContext.lastSolution = 'notes-check';
        return `Let's fix notes! 🔧\n\n**Important Steps:**\n1️⃣ You must highlight text FIRST:\n   • Notes are attached to highlights\n   • Can't add notes without highlighting\n\n2️⃣ Look for the note icon:\n   • Appears after highlighting\n   • Usually a 📝 icon\n\n3️⃣ Make sure to save:\n   • Click save after typing\n   • Don't just close the popup\n\n4️⃣ Check the Notes tab:\n   • Open the reader sidebar\n   • Click Notes to see all notes\n\nDid you find your notes? 📓`;
      } else if (aiChatContext.troubleshootingLevel >= 3) {
        aiChatContext.lastSolution = 'notes-advanced';
        return `Advanced notes troubleshooting! 🛠️\n\n**Check These:**\n1️⃣ Browser localStorage:\n   • Notes are saved locally\n   • Check privacy settings allow storage\n\n2️⃣ Try creating a test note:\n   • Highlight one word\n   • Add note "test"\n   • Check if it appears in Notes tab\n\n3️⃣ Look in browser console:\n   • Press F12\n   • Try adding a note\n   • Look for errors\n\n4️⃣ Try different browser:\n   • Test in Chrome/Firefox/Edge\n   • See if notes work there\n\nWhat happens when you try? 🔍`;
      }
    } else if (aiChatContext.lastTopic === 'progress') {
      aiChatContext.troubleshootingLevel++;
      
      if (aiChatContext.troubleshootingLevel === 2) {
        aiChatContext.lastSolution = 'progress-check';
        return `Let's fix progress tracking! 🔧\n\n**Check These:**\n1️⃣ Make sure you're reading enough:\n   • Progress saves every page turn\n   • Read at least 1-2 pages\n\n2️⃣ Don't close browser immediately:\n   • Give it a second to save\n   • Wait for page to fully load\n\n3️⃣ Check localStorage:\n   • Progress is saved locally\n   • Make sure cookies/storage enabled\n\n4️⃣ Try the Activity tab:\n   • Check if any books show progress there\n\nIs progress tracking now? 📊`;
      } else if (aiChatContext.troubleshootingLevel >= 3) {
        aiChatContext.lastSolution = 'progress-advanced';
        return `Advanced progress troubleshooting! 🛠️\n\n**Try These:**\n1️⃣ Clear browser cache:\n   • Ctrl+Shift+Delete\n   • Clear cached data\n   • Reload the site\n\n2️⃣ Check browser console:\n   • Press F12\n   • Look for storage errors\n   • Try reading a page\n\n3️⃣ Test in incognito mode:\n   • If it works there, it's an extension\n   • Disable extensions one by one\n\n4️⃣ Use a different browser:\n   • Try Chrome/Firefox/Edge\n   • See if progress saves there\n\nWhat do you see? 🔍`;
      }
    } else if (aiChatContext.lastTopic === 'reader' || question.includes('book wont open') || question.includes('book won\'t open') || question.includes('cant open') || question.includes('can\'t open')) {
      aiChatContext.troubleshootingLevel++;
      
      if (aiChatContext.troubleshootingLevel === 2) {
        aiChatContext.lastSolution = 'reader-check';
        return `Let's fix book loading! 🔧\n\n**Try These:**\n1️⃣ Refresh the page:\n   • Press F5 or Ctrl+R\n   • Try clicking the book again\n\n2️⃣ Clear browser cache:\n   • Ctrl+Shift+Delete\n   • Clear cached files\n   • Reload the site\n\n3️⃣ Check your internet connection:\n   • Books need to download first\n   • Make sure you're online\n\n4️⃣ Try a different book:\n   • See if other books open\n   • Helps identify if it's one book or all\n\nDoes the book open now? 📖`;
      } else if (aiChatContext.troubleshootingLevel >= 3) {
        aiChatContext.lastSolution = 'reader-advanced';
        return `Advanced reader troubleshooting! 🛠️\n\n**Check These:**\n1️⃣ Browser console errors:\n   • Press F12\n   • Click Console tab\n   • Try opening book\n   • Look for red errors\n\n2️⃣ File loading issues:\n   • Some books are large\n   • Wait 10-15 seconds\n   • Look for loading indicator\n\n3️⃣ Try different browser:\n   • Chrome/Firefox/Edge\n   • Test if books open there\n\n4️⃣ Disable extensions:\n   • Ad blockers can block content\n   • Try incognito mode\n\nWhat error message do you see? 🔍`;
      }
    }
    
    // Generic follow-up if no specific context - try to detect what feature from the question
    if (question.includes('download')) {
      aiChatContext.lastTopic = 'download';
      aiChatContext.troubleshootingLevel = 2;
      return `Let's try advanced solutions! 🔧\n\n**Check Browser Settings:**\n1️⃣ Make sure pop-ups are allowed:\n   • Chrome: chrome://settings/content/popups\n   • Firefox: about:preferences#privacy\n   • Edge: edge://settings/content/popups\n\n2️⃣ Check download settings:\n   • Verify download location exists\n   • Make sure "Ask where to save" is enabled\n\n3️⃣ Try clearing browser cache:\n   • Ctrl+Shift+Delete → Clear browsing data\n\nDid any of these help? 🤔`;
    } else if (question.includes('highlight')) {
      aiChatContext.lastTopic = 'highlight';
      aiChatContext.troubleshootingLevel = 2;
      return `Let's troubleshoot highlights! 🔧\n\n**Common Issues:**\n1️⃣ Make sure you're selecting text properly:\n   • Click and drag to select\n   • Don't just click once\n   • Select at least a few words\n\n2️⃣ Check if JavaScript is enabled:\n   • Highlights require JavaScript\n   • Check browser settings\n\n3️⃣ Try refreshing the page:\n   • Ctrl+F5 for hard refresh\n   • Reopen the book\n\nDoes highlighting work now? 🖍️`;
    } else if (question.includes('note')) {
      aiChatContext.lastTopic = 'notes';
      aiChatContext.troubleshootingLevel = 2;
      return `Let's fix notes! 🔧\n\n**Important Steps:**\n1️⃣ You must highlight text FIRST:\n   • Notes are attached to highlights\n   • Can't add notes without highlighting\n\n2️⃣ Look for the note icon:\n   • Appears after highlighting\n   • Usually a 📝 icon\n\n3️⃣ Make sure to save:\n   • Click save after typing\n   • Don't just close the popup\n\n4️⃣ Check the Notes tab:\n   • Open the reader sidebar\n   • Click Notes to see all notes\n\nDid you find your notes? 📓`;
    } else if (question.includes('progress') || question.includes('track')) {
      aiChatContext.lastTopic = 'progress';
      aiChatContext.troubleshootingLevel = 2;
      return `Let's fix progress tracking! 🔧\n\n**Check These:**\n1️⃣ Make sure you're reading enough:\n   • Progress saves every page turn\n   • Read at least 1-2 pages\n\n2️⃣ Don't close browser immediately:\n   • Give it a second to save\n   • Wait for page to fully load\n\n3️⃣ Check localStorage:\n   • Progress is saved locally\n   • Make sure cookies/storage enabled\n\n4️⃣ Try the Activity tab:\n   • Check if any books show progress there\n\nIs progress tracking now? 📊`;
    } else if (question.includes('open') || question.includes('load') || question.includes('book') || question.includes('reader')) {
      aiChatContext.lastTopic = 'reader';
      aiChatContext.troubleshootingLevel = 2;
      return `Let's fix book loading! 🔧\n\n**Try These:**\n1️⃣ Refresh the page:\n   • Press F5 or Ctrl+R\n   • Try clicking the book again\n\n2️⃣ Clear browser cache:\n   • Ctrl+Shift+Delete\n   • Clear cached files\n   • Reload the site\n\n3️⃣ Check your internet connection:\n   • Books need to download first\n   • Make sure you're online\n\n4️⃣ Try a different book:\n   • See if other books open\n   • Helps identify if it's one book or all\n\nDoes the book open now? 📖`;
    }
    
    // Generic follow-up if no specific context
    return `I'm sorry that didn't help! 😔\n\nCould you tell me more about:\n\n• What specific feature you're having trouble with?\n\n• What happens when you try?\n\n• Any error messages you see?\n\nI'll provide more targeted solutions! 💪`;
  }
  
  // Features - Download
  if (question.includes('download')) {
    aiChatContext.lastTopic = 'download';
    aiChatContext.troubleshootingLevel = 1;
    aiChatContext.lastSolution = 'basic-steps';
    return `To download books:\n1️⃣ Open any book in the reader\n2️⃣ Look for the download icon 📥\n3️⃣ Choose PDF or EPUB format\n4️⃣ Download starts instantly!\n\nDownloads are free for all books! 💾\n\nIf download doesn't work, let me know and I'll help troubleshoot! 🔧`;
  }
  
  // Features - Favorites
  if (question.includes('favorite') || question.includes('favourite')) {
    const favCount = state.favorites?.length || 0;
    return `You have ${favCount} favorite book(s)! ❤️\n\nTo add favorites:\n• Click the heart icon ❤️ on any book card\n• Find all favorites in your Activity tab\n\nKeep track of books you love! 💖`;
  }
  
  // Progress/Stats - detailed
  if (question.includes('progress') || question.includes('stats') || question.includes('achievement') || question.includes('my reading') || question.includes('show my')) {
    aiChatContext.lastTopic = 'progress';
    aiChatContext.troubleshootingLevel = 1;
    aiChatContext.lastSolution = 'basic-steps';
    try {
      const totalRead = Object.keys(state?.progress || {}).length;
      const favCount = state?.favorites?.length || 0;
      const streak = state?.streak || 0;
      return `📊 Your Reading Stats:\n\n📚 Books started: ${totalRead}\n❤️ Favorites: ${favCount}\n🔥 Reading streak: ${streak} days\n\nKeep reading to unlock achievements! Check the Activity tab for more details. 🏆`;
    } catch (error) {
      return `📊 Your Reading Stats:\n\n📚 Books started: 0\n❤️ Favorites: 0\n🔥 Reading streak: 0 days\n\nStart reading to track your progress! Check the Activity tab for more details. 🏆`;
    }
  }
  
  // Languages
  if (question.includes('language') || question.includes('spanish') || question.includes('portuguese') || question.includes('translate')) {
    const languages = [...new Set(books.map(b => b.language || 'English'))];
    return `🌍 Available languages: ${languages.join(', ')}\n\nUse the Advanced Filters (top right) to filter books by language. We're always adding more! 🗣️`;
  }
  
  // Genres - comprehensive
  if (question.includes('genre') || question.includes('category') || question.includes('type')) {
    const genres = [...new Set(books.flatMap(b => b.genres || []))].sort();
    return `🎭 Available Genres (${genres.length}):\n\n${genres.join(', ')}\n\nClick any genre tag on a book to filter by that genre! You can also use Advanced Filters to select multiple genres. 📚`;
  }
  
  // Reading experience
  if (question.includes('dark mode') || question.includes('theme')) {
    return `🌙 ReadWorld offers multiple themes:\n\n☀️ Light Mode\n🌙 Dark Mode\n📜 Sepia\n🕯️ Warm Candlelight\n\nChange themes in Settings or use the reader toolbar while reading! Your eyes will thank you. 👀`;
  }
  
  // Accessibility
  if (question.includes('accessibility') || question.includes('zoom') || question.includes('font size')) {
    return `♿ Accessibility Features:\n\n🔍 Text zoom controls\n🎨 Color-blind friendly mode\n🌙 High contrast themes\n📝 Adjustable font sizes\n\nFind these in Settings or in the reader toolbar! 🛠️`;
  }
  
  // Reader/Book opening issues
  if (question.includes('open') && (question.includes('book') || question.includes('reader')) && !question.includes('how')) {
    aiChatContext.lastTopic = 'reader';
    aiChatContext.troubleshootingLevel = 1;
    aiChatContext.lastSolution = 'basic-steps';
    return `To open a book:\n1️⃣ Click any book card on the main page\n2️⃣ The reader opens automatically\n3️⃣ Wait a moment for the book to load\n4️⃣ Start reading!\n\nBooks are free and unlimited! 📖\n\nIf books won't open, let me know and I'll help troubleshoot! 🔧`;
  }
  
  // Help/Support - more specific
  if (question.includes('help') || question.includes('support') || question.includes('problem') || question.includes('issue')) {
    return `💬 I'm here to help! I can answer questions about:\n\n📚 Book recommendations\n🔍 Finding books\n🖍️ Highlighting & notes\n📥 Downloads\n⚙️ Features & settings\n📊 Your reading stats\n❗ Troubleshooting issues\n\nWhat would you like to know? 🤔`;
  }
  
  // Greeting responses
  if (question.includes('hello') || question.includes('hi') || question === 'hey') {
    return `👋 Hi there! I'm your AI Helper. I can help you find books, learn features, or answer any questions about ReadWorld. What can I help you with today? 😊`;
  }
  
  // Thank you
  if (question.includes('thank') || question.includes('thanks')) {
    return `You're welcome! Happy reading! If you need anything else, just ask. 📚✨`;
  }
  
  // General questions about specific topics
  if (question.includes('what') || question.includes('how') || question.includes('where') || question.includes('when') || question.includes('why')) {
    // Try to give helpful guidance based on keywords
    if (question.includes('work') || question.includes('use')) {
      return `ReadWorld is easy to use! 📖\n\n• Browse books on the main page\n• Click any book to start reading\n• Use the reader toolbar for features\n• Check Activity tab for your stats\n\nWhat specific feature would you like to know about? 🤔`;
    }
    if (question.includes('find') || question.includes('search')) {
      return `To find books:\n\n🔍 Use the search bar at the top\n🏷️ Click genre tags to filter\n⚙️ Use Advanced Filters for detailed search\n📚 Browse by rating, language, or format\n\nLooking for something specific? 📖`;
    }
  }
  
  // Conversational responses - but only if they're standalone words, not part of requests
  if ((question === 'ok' || question === 'okay' || question === 'yes' || question === 'sure' || question === 'alright') && question.split(' ').length <= 2) {
    return `Great! Is there anything else I can help you with? 😊`;
  }
  
  if ((question === 'no' || question === 'nope' || question === 'nothing' || question === 'no thanks') && question.split(' ').length <= 2) {
    return `Alright! Feel free to ask me anything when you need help. Happy reading! 📚✨`;
  }
  
  // Default - smarter fallback with suggestions
  return `I understand you're asking about "${userQuestion}".\n\nWhile I'm not sure about that specific question, I can help you with:\n\n1. 📚 Book recommendations\n\n2. 🔍 Finding specific books or genres\n\n3. 🖍️ Using features (highlights, notes, downloads)\n\n4. 📊 Checking your reading stats\n\n5. ⚙️ App settings and themes\n\nCould you rephrase your question or choose one of these topics? 😊`;
  } catch (error) {
    console.error('Error in getAIResponse:', error);
    return `I'm here to help!\n\nI can answer questions about:\n\n1. 📚 Book recommendations\n\n2. 🔍 Finding books and genres\n\n3. 🖍️ Features like highlights and notes\n\n4. 📊 Your reading statistics\n\n5. ⚙️ Settings and customization\n\nWhat would you like to know? 😊`;
  }
}

function handleAIChat() {
  const input = $('aiChatInput');
  const message = input.value.trim();
  
  if (!message) return;
  
  // Add user message
  addChatMessage(message, true);
  input.value = '';
  
  // Show typing indicator
  const chatMessages = $('aiChatMessages');
  const typingDiv = document.createElement('div');
  typingDiv.id = 'typingIndicator';
  typingDiv.style.cssText = 'color: #9333ea; font-style: italic; padding: 8px; font-size: 0.85rem;';
  typingDiv.textContent = 'AI is typing...';
  chatMessages.appendChild(typingDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  
  // Get AI response after a short delay
  setTimeout(() => {
    const typing = $('typingIndicator');
    if (typing) typing.remove();
    
    const response = getAIResponse(message);
    addChatMessage(response, false);
  }, 800);
}

// AI Chat functionality for widget
function addWidgetChatMessage(message, isUser = false, addBookButtons = false) {
  const chatMessages = $('aiWidgetChatMessages');
  const messageDiv = document.createElement('div');
  messageDiv.style.cssText = `
    margin-bottom: 16px;
    padding: 10px 12px;
    border-radius: 8px;
    font-size: 0.85rem;
    line-height: 1.5;
    ${isUser ? 'background: #9333ea; color: white; margin-left: 15%; text-align: right;' : 'background: white; color: #1f2937; margin-right: 15%; border: 1px solid #e5e7eb;'}
  `;
  messageDiv.textContent = message;
  chatMessages.appendChild(messageDiv);
  
  // Add clickable book buttons if this is a recommendation response
  if (addBookButtons && !isUser) {
    const topBooks = [...books].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 3);
    const buttonsDiv = document.createElement('div');
    buttonsDiv.style.cssText = 'display: flex; flex-direction: column; gap: 6px; margin-top: 8px;';
    
    topBooks.forEach(book => {
      const bookBtn = document.createElement('button');
      bookBtn.style.cssText = 'background: white; border: 1px solid #e5e7eb; padding: 8px 10px; border-radius: 6px; text-align: left; cursor: pointer; transition: all 0.2s; font-size: 0.85rem;';
      bookBtn.innerHTML = `<strong>${book.title}</strong><br><span style="color: #6b7280; font-size: 0.75rem;">by ${book.author} ⭐${book.rating}</span>`;
      bookBtn.addEventListener('click', () => {
        openReader(book.id);
        addWidgetChatMessage(`Opening "${book.title}" for you! 📖`, false);
      });
      bookBtn.addEventListener('mouseenter', () => {
        bookBtn.style.borderColor = '#9333ea';
        bookBtn.style.backgroundColor = '#f3f4f6';
      });
      bookBtn.addEventListener('mouseleave', () => {
        bookBtn.style.borderColor = '#e5e7eb';
        bookBtn.style.backgroundColor = 'white';
      });
      buttonsDiv.appendChild(bookBtn);
    });
    
    chatMessages.appendChild(buttonsDiv);
  }
  
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function handleWidgetChat() {
  const input = $('aiWidgetChatInput');
  const message = input.value.trim();
  
  if (!message) return;
  
  // Add user message
  addWidgetChatMessage(message, true);
  input.value = '';
  
  // Show typing indicator
  const chatMessages = $('aiWidgetChatMessages');
  const typingDiv = document.createElement('div');
  typingDiv.id = 'widgetTypingIndicator';
  typingDiv.style.cssText = 'color: #9333ea; font-style: italic; padding: 6px; font-size: 0.8rem;';
  typingDiv.textContent = 'Typing...';
  chatMessages.appendChild(typingDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  
  // Get AI response after a short delay
  setTimeout(() => {
    try {
      const typing = $('widgetTypingIndicator');
      if (typing) typing.remove();
      
      const response = getAIResponse(message);
      
      // Check if this is a recommendation request to add book buttons
      const isRecommendationRequest = message.toLowerCase().includes('recommend') || 
                                       message.toLowerCase().includes('suggest') || 
                                       message.toLowerCase().includes('what should i read') ||
                                       message.toLowerCase().includes('need a book') ||
                                       message.toLowerCase().includes('want a book') ||
                                       message.toLowerCase().includes('romance') ||
                                       message.toLowerCase().includes('fantasy') ||
                                       message.toLowerCase().includes('horror') ||
                                       message.toLowerCase().includes('sci-fi');
      
      addWidgetChatMessage(response, false, isRecommendationRequest);
      
      // Add "Can I help with anything else?" message
      setTimeout(() => {
        addWidgetChatMessage("Can I help you with anything else? 😊", false);
        addBackToMenuButton();
      }, 500);
    } catch (error) {
      console.error('AI response error:', error);
      addWidgetChatMessage("Sorry, I encountered an error. Please try asking again! 🔄", false);
    }
  }, 800);
}

function addBackToMenuButton() {
  const chatMessages = $('aiWidgetChatMessages');
  const btnDiv = document.createElement('div');
  btnDiv.style.cssText = 'text-align: center; padding: 8px 0;';
  btnDiv.innerHTML = '<button id="backToMenuBtn" style="background: white; border: 1px solid #9333ea; color: #9333ea; padding: 8px 16px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; display: inline-flex; align-items: center; gap: 6px; transition: all 0.2s;">↩️ Back to Menu</button>';
  chatMessages.appendChild(btnDiv);
  chatMessages.scrollTop = chatMessages.scrollHeight;
  
  // Add click handler for back to menu
  $('backToMenuBtn')?.addEventListener('click', () => {
    // Reset troubleshooting context
    aiChatContext = {
      lastTopic: null,
      troubleshootingLevel: 0,
      lastSolution: null
    };
    
    // Clear chat except welcome message
    const chatMessages = $('aiWidgetChatMessages');
    chatMessages.innerHTML = '<div class="ai-widget-welcome">👋 Hi! How can I help you today?</div>';
    
    // Show quick actions again
    const quickActions = document.createElement('div');
    quickActions.id = 'aiQuickActions';
    quickActions.className = 'ai-quick-actions';
    quickActions.innerHTML = `
      <button class="ai-quick-btn" data-question="What should I read?">📚 Book recommendations</button>
      <button class="ai-quick-btn" data-question="How do I highlight text?">🖍️ How to highlight</button>
      <button class="ai-quick-btn" data-question="How many books do you have?">📖 Browse library</button>
      <button class="ai-quick-btn" data-question="Show my reading stats">📊 My progress</button>
    `;
    chatMessages.appendChild(quickActions);
    
    // Re-attach quick action listeners
    quickActions.querySelectorAll('.ai-quick-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const question = btn.dataset.question;
        const input = $('aiWidgetChatInput');
        input.value = question;
        handleWidgetChat();
        quickActions.remove();
      });
    });
  });
}

// Widget chat event listeners - wrapped in DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('🚀 DOM Content Loaded - Initializing all event listeners');
  
  const sendBtn = $('aiWidgetChatSend');
  const chatInput = $('aiWidgetChatInput');
  
  console.log('✅ Element check:', {
    sendBtn: !!sendBtn,
    chatInput: !!chatInput,
    aiWidget: !!$('aiWidget'),
    aiWidgetToggle: !!$('aiWidgetToggle'),
    aiWidgetClose: !!$('aiWidgetClose'),
    submitBookRequestBtn: !!$('submitBookRequestBtn'),
    viewRequestsBtn: !!$('viewRequestsBtn')
  });
  
  // Make AI Widget draggable and resizable
  const aiWidget = $('aiWidget');
  const aiWidgetHeader = document.querySelector('.ai-widget-header');
  
  if (aiWidget && aiWidgetHeader) {
    let isDragging = false;
    let currentX, currentY, initialX, initialY;
    
    aiWidgetHeader.addEventListener('mousedown', (e) => {
      // Don't drag if clicking on buttons
      if (e.target.closest('button')) return;
      
      isDragging = true;
      initialX = e.clientX - aiWidget.offsetLeft;
      initialY = e.clientY - aiWidget.offsetTop;
      
      aiWidget.style.transition = 'none';
      document.body.style.cursor = 'move';
    });
    
    document.addEventListener('mousemove', (e) => {
      if (!isDragging) return;
      
      e.preventDefault();
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;
      
      // Keep widget within viewport
      const maxX = window.innerWidth - aiWidget.offsetWidth;
      const maxY = window.innerHeight - aiWidget.offsetHeight;
      
      currentX = Math.max(0, Math.min(currentX, maxX));
      currentY = Math.max(0, Math.min(currentY, maxY));
      
      aiWidget.style.left = currentX + 'px';
      aiWidget.style.top = currentY + 'px';
      aiWidget.style.bottom = 'auto';
    });
    
    document.addEventListener('mouseup', () => {
      if (isDragging) {
        isDragging = false;
        aiWidget.style.transition = '';
        document.body.style.cursor = '';
      }
    });
  }
  
  if (sendBtn) {
    sendBtn.addEventListener('click', () => {
      console.log('Send button clicked');
      handleWidgetChat();
    });
  }
  
  if (chatInput) {
    chatInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        console.log('Enter key pressed');
        handleWidgetChat();
      }
    });
  }

  // Quick action buttons
  document.querySelectorAll('.ai-quick-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      console.log('Quick action clicked:', btn.dataset.question);
      const question = btn.dataset.question;
      const input = $('aiWidgetChatInput');
      if (input) {
        input.value = question;
        handleWidgetChat();
        // Hide quick actions after first use
        const quickActions = $('aiQuickActions');
        if (quickActions) quickActions.remove();
      }
    });
  });
  
  // About modal handlers - MOVED INSIDE DOMContentLoaded
  const aboutModal = $('aboutModal');
  const closeAboutBtn = $('closeAboutBtn');
  const submitBookRequestBtn = $('submitBookRequestBtn');
  
  console.log('🔍 Book request elements check:', {
    submitBookRequestBtn: !!submitBookRequestBtn,
    viewRequestsBtn: !!$('viewRequestsBtn'),
    requestsListSection: !!$('requestsListSection')
  });
  
  if (closeAboutBtn && aboutModal) {
    closeAboutBtn.addEventListener('click', () => {
      console.log('Close about button clicked');
      aboutModal.classList.add('hidden');
    });
  }
  
  if (aboutModal) {
    aboutModal.addEventListener('click', (e) => {
      if (e.target === aboutModal) {
        console.log('Clicked outside modal');
        aboutModal.classList.add('hidden');
      }
    });
  }
  
  // ESC key to close About modal
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && aboutModal && !aboutModal.classList.contains('hidden')) {
      aboutModal.classList.add('hidden');
    }
  });
  
  if (submitBookRequestBtn) {
    submitBookRequestBtn.addEventListener('click', () => {
      console.log('📚 Submit book request button clicked!');
      const title = $('requestBookTitle').value.trim();
      const author = $('requestBookAuthor').value.trim();
      const details = $('requestBookDetails').value.trim();
      
      console.log('Form values:', { title, author, details });
      
      if (!title) {
        showToast('⚠️ Please enter a book title');
        return;
      }
      
      // Store book request in localStorage
      if (!state.bookRequests) state.bookRequests = [];
      const newRequest = {
        title,
        author,
        details,
        date: new Date().toISOString()
      };
      state.bookRequests.push(newRequest);
      saveState();
      
      // Also save to JSON file for admin access
      console.log('📚 Book Request Submitted:', newRequest);
      console.log('💾 To view all requests, check: books/book-requests.json');
      console.log('💡 Or click "View All Requests" button in the About section');
      
      // Clear form
      $('requestBookTitle').value = '';
      $('requestBookAuthor').value = '';
      $('requestBookDetails').value = '';
      
      // Show confirmation
      const confirmation = $('requestConfirmation');
      confirmation.textContent = '✅ Request submitted! We\'ll review your suggestion.';
      confirmation.style.color = '#4caf50';
      
      showToast('📚 Book request submitted!');
      
      // Clear confirmation after 3 seconds
      setTimeout(() => {
        confirmation.textContent = '';
      }, 3000);
    });
  }
  
  // View Book Requests (Admin)
  const viewRequestsBtn = $('viewRequestsBtn');
  const requestsListSection = $('requestsListSection');
  const closeRequestsBtn = $('closeRequestsBtn');
  const requestsList = $('requestsList');
  
  if (viewRequestsBtn) {
    viewRequestsBtn.addEventListener('click', () => {
      console.log('🔍 View requests button clicked!');
      const requests = state.bookRequests || [];
      console.log('Current requests:', requests);
      
      if (requests.length === 0) {
        requestsList.innerHTML = '<p class="muted" style="text-align: center; padding: 20px;">No book requests yet.</p>';
      } else {
        requestsList.innerHTML = requests.map((req, index) => {
          const date = new Date(req.date).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          });
          
          return `
            <div class="request-card" style="background: white; border: 1px solid #e5e7eb; border-radius: 8px; padding: 12px; margin-bottom: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                <div>
                  <h4 style="margin: 0 0 4px 0; color: #1f2937; font-size: 0.95rem;">📚 ${req.title || 'Untitled'}</h4>
                  ${req.author ? `<p style="margin: 0 0 4px 0; color: #6b7280; font-size: 0.85rem;">✍️ by ${req.author}</p>` : ''}
                  ${req.details ? `<p style="margin: 0 0 8px 0; color: #4b5563; font-size: 0.85rem;">${req.details}</p>` : ''}
                  <p style="margin: 0; color: #9ca3af; font-size: 0.75rem;">🕒 ${date}</p>
                </div>
                <button class="delete-request-btn" data-index="${index}" style="background: #fee2e2; color: #dc2626; border: none; padding: 6px 10px; border-radius: 6px; cursor: pointer; font-size: 0.8rem; font-weight: 500;">
                  🗑️ Delete
                </button>
              </div>
            </div>
          `;
        }).join('');
        
        // Add delete functionality
        document.querySelectorAll('.delete-request-btn').forEach(btn => {
          btn.addEventListener('click', function() {
            const index = parseInt(this.dataset.index);
            if (confirm('Delete this book request?')) {
              state.bookRequests.splice(index, 1);
              saveState();
              showToast('🗑️ Request deleted');
              viewRequestsBtn.click(); // Refresh the list
            }
          });
        });
      }
      
      requestsListSection.classList.remove('hidden');
      viewRequestsBtn.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  }
  
  if (closeRequestsBtn) {
    closeRequestsBtn.addEventListener('click', () => {
      requestsListSection.classList.add('hidden');
    });
  }
  
  // Export Book Requests
  const exportRequestsBtn = $('exportRequestsBtn');
  if (exportRequestsBtn) {
    exportRequestsBtn.addEventListener('click', () => {
      const requests = state.bookRequests || [];
      
      if (requests.length === 0) {
        showToast('⚠️ No requests to export');
        return;
      }
      
      // Export as both CSV and JSON
      const exportType = confirm('Export as JSON? (Cancel for CSV)');
      
      if (exportType) {
        // Export as JSON
        const jsonContent = JSON.stringify(requests, null, 2);
        const blob = new Blob([jsonContent], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `book-requests-${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast('📥 Requests exported to JSON!');
        console.log('📄 JSON Content:', jsonContent);
        console.log('💡 Copy the content above and paste into books/book-requests.json');
      } else {
        // Export as CSV
        let csvContent = 'Title,Author,Details,Date\n';
        requests.forEach(req => {
          const title = (req.title || '').replace(/"/g, '""');
          const author = (req.author || '').replace(/"/g, '""');
          const details = (req.details || '').replace(/"/g, '""');
          const date = new Date(req.date).toLocaleString();
          csvContent += `"${title}","${author}","${details}","${date}"\n`;
        });
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `book-requests-${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        showToast('📥 Requests exported to CSV!');
      }
    });
  }
  
  // Copy requests to clipboard as JSON
  const copyRequestsBtn = document.createElement('button');
  copyRequestsBtn.textContent = '📋 Copy JSON';
  copyRequestsBtn.className = 'secondary-btn';
  copyRequestsBtn.style.cssText = 'font-size: 0.85rem; padding: 6px 12px; background: #fef3c7; color: #92400e; border: 1px solid #fde68a; margin-left: 8px;';
  
  if (exportRequestsBtn && exportRequestsBtn.parentElement) {
    exportRequestsBtn.parentElement.insertBefore(copyRequestsBtn, exportRequestsBtn);
    
    copyRequestsBtn.addEventListener('click', async () => {
      const requests = state.bookRequests || [];
      
      if (requests.length === 0) {
        showToast('⚠️ No requests to copy');
        return;
      }
      
      const jsonContent = JSON.stringify(requests, null, 2);
      
      try {
        await navigator.clipboard.writeText(jsonContent);
        showToast('📋 Copied to clipboard! Paste into book-requests.json');
        console.log('📄 Copied JSON:', jsonContent);
      } catch (err) {
        console.error('Failed to copy:', err);
        showToast('❌ Copy failed - check console for JSON');
        console.log('📄 Manual copy:', jsonContent);
      }
    });
  }
  
  // Toggle widget minimize/maximize - MOVED INSIDE DOMContentLoaded
  const aiWidgetToggle = $('aiWidgetToggle');
  if (aiWidgetToggle) {
    aiWidgetToggle.addEventListener('click', (e) => {
      e.stopPropagation();
      const widget = $('aiWidget');
      const toggle = $('aiWidgetToggle');
      if (widget && toggle) {
        widget.classList.toggle('minimized');
        toggle.textContent = widget.classList.contains('minimized') ? '+' : '−';
        console.log('Widget minimized:', widget.classList.contains('minimized'));
      }
    });
  }

  // Close widget completely - MOVED INSIDE DOMContentLoaded
  const aiWidgetClose = $('aiWidgetClose');
  if (aiWidgetClose) {
    aiWidgetClose.addEventListener('click', (e) => {
      e.stopPropagation();
      const widget = $('aiWidget');
      if (widget) {
        widget.classList.add('hidden');
        localStorage.setItem('aiWidgetOpen', 'false');
        console.log('Widget closed');
      }
    });
  }
  
  // Open AI Helper button - NEW
  const openAiHelperBtn = $('openAiHelperBtn');
  if (openAiHelperBtn) {
    openAiHelperBtn.addEventListener('click', () => {
      const widget = $('aiWidget');
      if (widget) {
        widget.classList.remove('hidden');
        widget.classList.remove('minimized');
        localStorage.setItem('aiWidgetOpen', 'true');
        console.log('Widget opened');
        
        // Update toggle button
        const toggle = $('aiWidgetToggle');
        if (toggle) toggle.textContent = '−';
      }
    });
  }

  // Expand widget on header click (but not on buttons) - MOVED INSIDE DOMContentLoaded
  const widgetHeader = $('aiWidget')?.querySelector('.ai-widget-header');
  if (widgetHeader) {
    widgetHeader.addEventListener('click', (e) => {
      if (e.target.closest('.ai-widget-toggle') || e.target.closest('.ai-widget-close')) {
        return;
      }
      const widget = $('aiWidget');
      const toggle = $('aiWidgetToggle');
      if (widget && toggle && widget.classList.contains('minimized')) {
        widget.classList.remove('minimized');
        toggle.textContent = '−';
        console.log('Widget expanded');
      }
    });
  }
  
  // Quote modal handlers - MOVED INSIDE DOMContentLoaded
  const closeQuoteBtn = $('closeQuoteBtn');
  const quoteModal = $('quoteModal');
  
  if (closeQuoteBtn && quoteModal) {
    closeQuoteBtn.addEventListener('click', () => {
      quoteModal.classList.add('hidden');
    });
  }
  
  if (quoteModal) {
    quoteModal.addEventListener('click', (e) => {
      if (e.target === quoteModal) {
        quoteModal.classList.add('hidden');
      }
    });
  }
});

// ===== ACCESSIBILITY =====
function applyAccessibilitySettings() {
  const pdfView = $('pdfView');
  const epubContainer = $('epubContainer');
  const textLayer = document.getElementById('pdf-text-layer');
  
  console.log("=== APPLYING ACCESSIBILITY SETTINGS ===");
  console.log("state.accessibility.darkMode:", state.accessibility.darkMode);
  console.log("state.accessibility.colorBlind:", state.accessibility.colorBlind);
  
  // Theme (Light/Dark)
  const darkMode = state.accessibility.darkMode || false;
  console.log('Applying dark mode:', darkMode);
  
  if (darkMode) {
    document.body.classList.add('dark-theme');
    console.log('✓ Dark theme CLASS ADDED to body');
    console.log('Body now has dark-theme class?', document.body.classList.contains('dark-theme'));
  } else {
    document.body.classList.remove('dark-theme');
    console.log('✓ Light theme - dark-theme CLASS REMOVED from body');
  }
  
  // Color Blind Mode
  console.log('Applying color blind mode:', state.accessibility.colorBlind);
  
  if (state.accessibility.colorBlind) {
    document.body.classList.add('color-blind');
    console.log('✓ Color blind CLASS ADDED to body');
    console.log('Body now has color-blind class?', document.body.classList.contains('color-blind'));
  } else {
    document.body.classList.remove('color-blind');
    console.log('✗ Color blind mode disabled - CLASS REMOVED');
  }
  
  // Reader theme
  const theme = state.accessibility.theme || 'light';
  if (pdfView) {
    pdfView.classList.remove('theme-light', 'theme-dark', 'theme-sepia', 'theme-warm');
    pdfView.classList.add(`theme-${theme}`);
  }
  if (epubContainer) {
    epubContainer.classList.remove('theme-light', 'theme-dark', 'theme-sepia', 'theme-warm');
    epubContainer.classList.add(`theme-${theme}`);
  }
  
  // Zoom
  applyZoom();
  
  console.log("Final body.className:", document.body.className);
  console.log("Body classList:", Array.from(document.body.classList));
  console.log("=== SETTINGS APPLIED ===");
}



function adjustZoom(delta) {
  if (!state.accessibility.zoom) {
    state.accessibility.zoom = 1.0;
  }
  state.accessibility.zoom = Math.max(0.5, Math.min(2.0, state.accessibility.zoom + delta));
  console.log('New zoom level:', state.accessibility.zoom);
  saveState();
  applyZoom();
  showToast(`🔍 Zoom: ${Math.round(state.accessibility.zoom * 100)}%`);
}

function resetZoom() {
  state.accessibility.zoom = 1.0;
  console.log('Zoom reset to 1.0');
  saveState();
  applyZoom();
  showToast('🔍 Zoom reset to 100%');
}

function applyZoom() {
  const zoom = state.accessibility.zoom || 1.0;
  const pdfCanvas = $('pdfCanvas');
  const pdfView = $('pdfView');
  const epubContainer = $('epubContainer');
  const textLayer = document.getElementById('pdf-text-layer');
  
  console.log('Applying zoom:', zoom, 'pdfView exists:', !!pdfView, 'epubContainer exists:', !!epubContainer);
  
  // Apply zoom to entire PDF view container (canvas + text layer together)
  if (pdfView && !pdfView.classList.contains('hidden')) {
    pdfView.style.transform = `scale(${zoom})`;
    pdfView.style.transformOrigin = 'top center';
    pdfView.style.transition = 'transform 0.2s ease';
    console.log('PDF zoom applied');
  }
  
  // Apply zoom to EPUB container
  if (epubContainer && !epubContainer.classList.contains('hidden')) {
    epubContainer.style.transform = `scale(${zoom})`;
    epubContainer.style.transformOrigin = 'top center';
    epubContainer.style.transition = 'transform 0.2s ease';
    console.log('EPUB zoom applied');
  }
  
  // Update zoom level display
  const zoomLevel = document.getElementById('zoomLevel');
  if (zoomLevel) {
    zoomLevel.textContent = `${Math.round(zoom * 100)}%`;
  }
}

// Make zoom functions globally accessible for inline onclick handlers
window.adjustZoom = adjustZoom;
window.resetZoom = resetZoom;

// ===== READER HELPERS =====
function showPdfView() {
  $("pdfView").classList.remove("hidden");
  $("epubContainer").classList.add("hidden");
}

function showEpubView() {
  $("pdfView").classList.add("hidden");
  $("epubContainer").classList.remove("hidden");
}

// ===== PDF FUNCTIONS =====
// PDF.js config
if (window["pdfjsLib"]) {
  pdfjsLib.GlobalWorkerOptions.workerSrc =
    "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js";
}

function loadPdf(book, startPage = 1) {
  showPdfView();

  pdfDoc = null;
  pdfTotalPages = 0;

  pdfjsLib
    .getDocument(book.fileUrl)
    .promise.then((doc) => {
      pdfDoc = doc;
      pdfTotalPages = doc.numPages;
      currentPage = Math.min(Math.max(1, startPage), pdfTotalPages);
      renderPdfPage(currentPage);
    })
    .catch((err) => {
      console.error(err);
      showToast("Failed to load PDF.");
    });
}

function renderPdfPage(pageNum) {
  if (!pdfDoc) return;
  
  currentPdfPage = pageNum;

  pdfDoc.getPage(pageNum).then((page) => {
    const canvas = $("pdfCanvas");
    const ctx = canvas.getContext("2d");

    const viewport = page.getViewport({ scale: 0.9 });
    canvas.height = viewport.height;
    canvas.width = viewport.width;

    const renderContext = {
      canvasContext: ctx,
      viewport: viewport
    };
    
    page.render(renderContext).promise.then(() => {
      // Add text layer for selection
      return page.getTextContent();
    }).then((textContent) => {
      // Create or get text layer div
      let textLayerDiv = document.getElementById('pdf-text-layer');
      if (!textLayerDiv) {
        textLayerDiv = document.createElement('div');
        textLayerDiv.id = 'pdf-text-layer';
        textLayerDiv.className = 'pdf-text-layer';
        $('pdfView').appendChild(textLayerDiv);
      }
      
      // Clear previous text
      textLayerDiv.innerHTML = '';
      textLayerDiv.style.width = canvas.width + 'px';
      textLayerDiv.style.height = canvas.height + 'px';
      
      // Render text layer
      if (window.pdfjsLib && window.pdfjsLib.renderTextLayer) {
        window.pdfjsLib.renderTextLayer({
          textContent: textContent,
          container: textLayerDiv,
          viewport: viewport,
          textDivs: []
        });
      } else {
        // Fallback: simple text rendering
        textContent.items.forEach((item) => {
          const div = document.createElement('div');
          div.textContent = item.str;
          div.style.position = 'absolute';
          div.style.left = item.transform[4] + 'px';
          div.style.top = item.transform[5] + 'px';
          div.style.fontSize = Math.abs(item.transform[0]) + 'px';
          div.style.fontFamily = item.fontName;
          textLayerDiv.appendChild(div);
        });
      }
    }).catch((err) => {
      console.error("Error rendering text layer:", err);
    });

    // Update progress bar + text
    const pct = (pageNum / pdfTotalPages) * 100;
    $("progressFill").style.width = pct + "%";
    $("progressText").textContent = `Page ${pageNum} of ${pdfTotalPages}`;
    
    // Update bookmark button state
    updateBookmarkButton();
  });
}

// ===== EPUB FUNCTIONS =====
function loadEpub(book, savedProgress) {
  console.log("Loading EPUB:", book.fileUrl);
  showEpubView();

  try {
    epubBook = ePub(book.fileUrl);
    console.log("EPUB book object created:", epubBook);
    
    epubRendition = epubBook.renderTo("epubContainer", {
      width: "100%",
      height: "100%",
      flow: "paginated"
    });
    console.log("EPUB rendition created:", epubRendition);

    epubRendition.on("relocated", (location) => {
      console.log("EPUB relocated:", location);
      epubCurrentLocation = location;
      updateEpubProgress();
    });

    epubRendition.on("rendered", () => {
      console.log("EPUB rendered successfully!");
    });

    // If we have a saved CFI location, use it
    if (savedProgress && savedProgress.cfi) {
      console.log("Displaying saved CFI location:", savedProgress.cfi);
      epubRendition.display(savedProgress.cfi).catch((err) => {
        console.error("Error displaying saved location:", err);
        epubRendition.display();
      });
    } else {
      console.log("Displaying EPUB from start");
      epubRendition.display().then(() => {
        console.log("EPUB display() promise resolved");
      }).catch((err) => {
        console.error("Error displaying EPUB:", err);
        showToast("Failed to display EPUB content.");
      });
    }

    // Generate locations for progress bar (100 chunks)
    epubBook.ready
      .then(() => {
        console.log("EPUB book ready, generating locations...");
        return epubBook.locations.generate(100);
      })
      .then(() => {
        console.log("EPUB locations generated successfully");
        updateEpubProgress();
      })
      .catch((err) => {
        console.error("Error generating locations:", err);
      });
  } catch (err) {
    console.error("Error loading EPUB:", err);
    showToast("Failed to load EPUB file.");
  }
}

function updateEpubProgress() {
  if (!epubBook || !epubCurrentLocation) return;

  const loc = epubBook.locations.percentageFromCfi(
    epubCurrentLocation.start.cfi
  ); // 0-1
  const pct = Math.round((loc || 0) * 100);

  $("progressFill").style.width = pct + "%";
  $("progressText").textContent = `Progress: ${pct}%`;
}

// ===== READER =====
function openReader(bookId) {
  currentBook = books.find((b) => b.id === bookId);
  if (!currentBook) return;

  // Everyone has full access - no sample mode
  isSampleMode = false;

  $("readerBookCover").src = currentBook.cover;
  $("readerTitle").textContent = currentBook.title;
  $("readerAuthor").textContent = `by ${currentBook.author}`;
  
  // Populate Book Info section
  $("readerAuthorInfo").textContent = `Author: ${currentBook.author}`;
  
  // Render clickable genres
  const genresArray = currentBook.genres || [currentBook.genre];
  const genresHTML = genresArray.map(genre => 
    `<span class="genre-tag" onclick="filterByGenreFromReader('${genre}')" title="View all ${genre} books">${genre}</span>`
  ).join(' ');
  $("readerGenres").innerHTML = `Genres: ${genresHTML}`;
  
  $("readerPublishDate").textContent = `Published: ${currentBook.publishDate || 'N/A'}`;
  $("readerISBN").textContent = `ISBN: ${currentBook.isbn || 'N/A'}`;
  $("readerPages").textContent = `Pages: ${currentBook.pages}`;
  $("readerLanguage").textContent = `Language: ${currentBook.language || 'English'}`;
  
  // Display synopsis
  if (currentBook.synopsis) {
    $("readerSynopsis").innerHTML = `<p><strong>Synopsis:</strong><br>${currentBook.synopsis}</p>`;
  } else {
    $("readerSynopsis").innerHTML = '';
  }
  
  $("readerRating").textContent = `Book Rating: ⭐ ${currentBook.rating.toFixed(1)}`;

  // Render rating distribution and reviews
  renderRatingDistribution(currentBook);
  renderUserReviews(currentBook);
  
  $("reviewSavedMsg").textContent = "";
  
  // Load saved review (handle both old string format and new object format)
  const savedReview = state.reviews[bookId];
  const nameInput = $("reviewNameInput");
  
  if (typeof savedReview === 'string') {
    $("reviewInput").value = savedReview;
    if (nameInput) nameInput.value = state.userName || "";
  } else if (savedReview && savedReview.text) {
    $("reviewInput").value = savedReview.text;
    if (nameInput) nameInput.value = savedReview.name || state.userName || "";
  } else {
    $("reviewInput").value = "";
    if (nameInput) nameInput.value = state.userName || "";
  }
  
  // Everyone can write reviews
  $("reviewInput").placeholder = "Share your thoughts about this book...";
  $("reviewInput").readOnly = false;
  
  // Load saved rating if exists
  if (!state.userRatings) state.userRatings = {};
  selectedUserRating = state.userRatings[bookId] || 0;
  
  // Re-initialize star rating to ensure event listeners work
  initStarRating();
  updateStarDisplay();

  // Default page from saved progress if any
  const saved = state.progress[bookId] || null;
  currentPage = saved?.page || 1;

  // Reset reader containers
  $("pdfCanvas").getContext && $("pdfCanvas").getContext("2d").clearRect(0, 0, $("pdfCanvas").width, $("pdfCanvas").height);
  $("epubContainer").innerHTML = "";

  if (currentBook.format === "pdf") {
    loadPdf(currentBook, currentPage);
  } else if (currentBook.format === "epub") {
    loadEpub(currentBook, saved);
  } else {
    showToast("Unknown book format.");
  }

  $("readerModal").classList.remove("hidden");
  addToRecent(bookId);
  renderRightPanel();
  renderAnnotations();
  applyAccessibilitySettings();
  updateBookmarkButton();
  
  // Reset to Info tab
  $("infoTab").click();
  
  // Show recommendations after a short delay if enabled
  if (!state.preferences) state.preferences = {};
  if (state.preferences.showRecommendations !== false) {
    setTimeout(() => showRecommendations(), 2000);
  }
}

function closeReader() {
  $("readerModal").classList.add("hidden");
  currentBook = null;
  isSampleMode = false;
}

function addToRecent(bookId) {
  state.recent = [bookId, ...state.recent.filter((id) => id !== bookId)];
  saveState();
}

function updateReaderPage() {
  if (!currentBook) return;
  currentPage = Math.min(
    Math.max(1, currentPage),
    currentBook.pages || 1
  );

  $("readerPage").textContent =
    currentBook.sampleText +
    `\n\n[Sample page ${currentPage}/${currentBook.pages}]`;

  const pct = (currentPage / currentBook.pages) * 100;
  $("progressFill").style.width = pct + "%";
  $("progressText").textContent = `Page ${currentPage} of ${currentBook.pages}`;
}

function saveProgress() {
  if (!currentBook) return;
  
  // Everyone can save progress - no restrictions
  let progressData = {};

  if (currentBook.format === "pdf") {
    progressData = {
      page: currentPage
    };
  } else if (currentBook.format === "epub") {
    if (!epubCurrentLocation) {
      showToast("Open at least one page before saving.");
      return;
    }

    progressData = {
      page: 0, // not used, but kept for compatibility
      cfi: epubCurrentLocation.start.cfi
    };
  }

  const wasFirstSave = Object.keys(state.progress).length === 0;
  
  state.progress[currentBook.id] = progressData;
  saveState();
  showToast("Progress saved!");
  renderBooks();
  renderRightPanel();
  
  // Check for first save achievement
  if (wasFirstSave) {
    checkAchievement('firstSave');
  }
  
  // Track reading minutes (simplified - assume 5 minutes per save)
  state.readingMinutesToday += 5;
  checkAchievement('reading30min');
}

function autoSaveProgress() {
  if (!currentBook || isSampleMode) return;
  
  // Check if auto-save is enabled
  if (!state.preferences) state.preferences = { autoSave: true };
  if (state.preferences.autoSave === false) return;

  let progressData = {};

  if (currentBook.format === "pdf") {
    progressData = {
      page: currentPage
    };
  } else if (currentBook.format === "epub") {
    if (!epubCurrentLocation) return;
    progressData = {
      page: 0,
      cfi: epubCurrentLocation.start.cfi
    };
  }

  state.progress[currentBook.id] = progressData;
  saveState();
}

function changePage(delta) {
  if (!currentBook) return;

  if (currentBook.format === "pdf") {
    if (!pdfDoc) return;
    const target = currentPage + delta;
    
    // Full access for everyone - no restrictions
    if (target < 1 || target > pdfTotalPages) return;
    currentPage = target;
    renderPdfPage(currentPage);
    updateBookmarkButton();
    
    // Auto-save progress
    autoSaveProgress();
  } else if (currentBook.format === "epub") {
    if (!epubRendition) return;
    
    // Full access for everyone - no restrictions
    try {
      if (delta > 0) {
        epubRendition.next();
      } else if (delta < 0) {
        epubRendition.prev();
      }
      
      // Auto-save progress
      setTimeout(() => autoSaveProgress(), 500);
    } catch (err) {
      console.error("Navigation error:", err);
      showToast("Navigation error. Please wait for the book to load fully.");
    }
  }
}

// ===== REVIEWS =====
function deleteUserReview(bookId) {
  // Delete review text
  if (state.reviews[bookId]) {
    delete state.reviews[bookId];
  }
  
  // Delete rating
  if (state.userRatings && state.userRatings[bookId]) {
    delete state.userRatings[bookId];
  }
  
  // Reset selected rating
  selectedUserRating = 0;
  updateStarDisplay();
  
  // Clear review input
  $("reviewInput").value = "";
  const nameInput = $("reviewNameInput");
  if (nameInput) nameInput.value = state.userName || "";
  
  // Update state (handle both string and object format)
  state.reviewsWritten = Object.keys(state.reviews).filter(id => {
    const review = state.reviews[id];
    return review && (typeof review === 'string' ? review : review.text);
  }).length;
  saveState();
  
  // Refresh the rating distribution and reviews list
  if (currentBook && currentBook.id === bookId) {
    renderRatingDistribution(currentBook);
    renderUserReviews(currentBook);
  }
  
  showToast("✅ Your review has been deleted");
}

function saveReview() {
  if (!currentBook) return;
  
  // Everyone can save reviews - no restrictions
  const nameInput = $("reviewNameInput");
  const name = nameInput ? nameInput.value.trim() : state.userName || "Anonymous";
  const text = $("reviewInput").value.trim();
  
  if (!name || name === "Anonymous") {
    showToast("⚠️ Please enter your name!");
    if (nameInput) nameInput.focus();
    return;
  }
  
  if (!text && selectedUserRating === 0) {
    showToast("⚠️ Please add a rating or review text!");
    return;
  }
  
  // Save the name for future reviews
  state.userName = name;
  
  // Save review with full details
  state.reviews[currentBook.id] = {
    text: text,
    name: name,
    date: new Date().toISOString()
  };
  
  // Save the rating separately if provided
  if (!state.userRatings) state.userRatings = {};
  if (selectedUserRating > 0) {
    state.userRatings[currentBook.id] = selectedUserRating;
  }
  
  $("reviewSavedMsg").textContent = selectedUserRating > 0 
    ? `✓ Review and ${selectedUserRating}-star rating saved!` 
    : "✓ Review saved!";
  setTimeout(() => $("reviewSavedMsg").textContent = "", 3000);
  
  state.reviewsWritten = Object.keys(state.reviews).filter(id => state.reviews[id] && state.reviews[id].text).length;
  saveState();
  checkAchievement('reviews10');
  
  // Refresh the rating distribution and reviews list
  renderRatingDistribution(currentBook);
  renderUserReviews(currentBook);
  
  showToast("✅ Your review has been saved!");
}

// ===== AUTH UI =====
function updateAuthUI() {
  // No authentication needed - everyone is a guest with full access
  // Update right panel if it's open
  if (!$("rightPanel").classList.contains("hidden")) {
    renderRightPanel();
  }
}

function openAuthModal(mode = "login") {
  // Authentication disabled - do nothing
}

function closeAuthModal() {
  // Authentication disabled - do nothing
}

function toggleAuthMode() {
  // Authentication disabled - do nothing
}

async function handleAuthSubmit(e) {
  e.preventDefault();
  const mode = $("authModal").dataset.mode;
  const email = $("authEmail").value.trim();
  const password = $("authPassword").value.trim();
  const username = $("authUsername").value.trim();
  
  // Hide previous errors
  $("authError").classList.add("hidden");
  
  try {
    if (mode === "register") {
      if (!username) {
        throw new Error("Username is required for registration");
      }
      await register(username, email, password);
      showToast("Registration successful!");
    } else {
      await login(email, password);
      showToast("Login successful!");
    }
    closeAuthModal();
    updateAuthUI();
    renderRightPanel();
    renderBooks();
  } catch (err) {
    // Show detailed error in modal
    const errorEl = $("authError");
    let errorMessage = "";
    
    if (err.message.includes("already exists")) {
      errorMessage = "❌ This email is already registered. Please login instead or use a different email.";
    } else if (err.message.includes("Invalid credentials") || err.message.includes("not found")) {
      errorMessage = "❌ Invalid email or password. Please check your credentials and try again.";
    } else if (err.message.includes("password")) {
      errorMessage = "❌ Password is required and must be at least 6 characters long.";
    } else if (err.message.includes("email")) {
      errorMessage = "❌ Please enter a valid email address.";
    } else {
      errorMessage = "❌ " + err.message;
    }
    
    errorEl.textContent = errorMessage;
    errorEl.classList.remove("hidden");
  }
}

function toggleAuthMode() {
  const currentMode = $("authModal").dataset.mode;
  const newMode = currentMode === "login" ? "register" : "login";
  
  // Show/hide username field for registration
  const usernameField = $("authUsername");
  if (newMode === "register") {
    usernameField.classList.remove("hidden");
    usernameField.required = true;
  } else {
    usernameField.classList.add("hidden");
    usernameField.required = false;
  }
  
  openAuthModal(newMode);
}

// ===== PLAN / SUBSCRIPTION ===== (Disabled - no subscriptions needed)
async function togglePlan() {
  // Subscriptions disabled - all features free
  return;
  
  if (state.plan === "free") {
    if (confirm("Upgrade to Premium plan for $5/month?")) {
      try {
        await upgradeToPremium();
      } catch (err) {
        let errorMessage = "";
        if (err.message.includes("payment")) {
          errorMessage = "❌ Payment failed. Please check your payment method and try again.";
        } else if (err.message.includes("token") || err.message.includes("auth")) {
          errorMessage = "❌ Session expired. Please login again.";
        } else {
          errorMessage = "❌ Upgrade failed: " + err.message;
        }
        showToast(errorMessage);
      }
    }
  } else {
    if (confirm("Switch back to Free plan?")) {
      try {
        await downgradePlan();
      } catch (err) {
        showToast("❌ Downgrade failed: " + err.message);
      }
    }
  }
}

// ===== EVENTS =====
function initEvents() {
  $("searchBtn").addEventListener("click", () => {
    currentSearch = $("searchInput").value.trim();
    renderBooks();
  });

  $("searchInput").addEventListener("keyup", (e) => {
    if (e.key === "Enter") {
      currentSearch = $("searchInput").value.trim();
      renderBooks();
    }
  });

  $("onlyFavoritesCheckbox").addEventListener("change", renderBooks);
  $("onlyInProgressCheckbox").addEventListener("change", renderBooks);

  $("closeReaderBtn").addEventListener("click", closeReader);
  $("prevPageBtn").addEventListener("click", () => changePage(-1));
  $("nextPageBtn").addEventListener("click", () => changePage(1));
  
  // Bookmark button with safety check
  const bookmarkBtn = $("addBookmarkBtn");
  if (bookmarkBtn) {
    console.log('✅ Bookmark button found, adding event listener');
    bookmarkBtn.addEventListener("click", () => {
      console.log('🔖 BOOKMARK BUTTON CLICKED!');
      window.toggleBookmark();
    });
  } else {
    console.error('❌ Bookmark button NOT found!');
  }
  
  // Note buttons with logging
  const noteBtn = $("addNoteBtn");
  if (noteBtn) {
    console.log('✅ Note button found, adding event listener');
    noteBtn.addEventListener("click", () => {
      console.log('📝 NOTE BUTTON CLICKED!');
      window.showQuickNoteBox();
    });
  }
  
  const saveNoteBtn = $("saveQuickNoteBtn");
  if (saveNoteBtn) {
    console.log('✅ Save note button found, adding event listener');
    saveNoteBtn.addEventListener("click", () => {
      console.log('💾 SAVE NOTE BUTTON CLICKED!');
      window.saveQuickNote();
    });
  }
  
  const cancelNoteBtn = $("cancelQuickNoteBtn");
  if (cancelNoteBtn) {
    console.log('✅ Cancel note button found, adding event listener');
    cancelNoteBtn.addEventListener("click", () => {
      console.log('❌ CANCEL NOTE BUTTON CLICKED!');
      window.hideQuickNoteBox();
    });
  }
  
  $("saveProgressBtn").addEventListener("click", saveProgress);
  $("saveReviewBtn").addEventListener("click", saveReview);
  
  // Review textarea - everyone can write reviews
  // No login needed

  // Reader sidebar tabs
  $("infoTab").addEventListener("click", () => {
    $("infoTab").classList.add("active");
    $("annotationsTab").classList.remove("active");
    $("infoTabContent").classList.remove("hidden");
    $("annotationsTabContent").classList.add("hidden");
  });
  
  $("annotationsTab").addEventListener("click", () => {
    $("annotationsTab").classList.add("active");
    $("infoTab").classList.remove("active");
    $("annotationsTabContent").classList.remove("hidden");
    $("infoTabContent").classList.add("hidden");
  });

  // Highlight buttons
  document.querySelectorAll(".highlight-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      console.log("Highlight button clicked");
      const color = btn.dataset.color;
      console.log("Highlight color:", color);
      
      // Toggle active state
      document.querySelectorAll(".highlight-btn").forEach(b => b.classList.remove("active"));
      
      if (selectedHighlightColor === color) {
        selectedHighlightColor = null;
        console.log("Highlighting disabled");
        showToast("❌ Highlighting disabled");
        
        // Reset cursor
        const pdfView = $('pdfView');
        const epubContainer = $('epubContainer');
        if (pdfView) pdfView.style.cursor = '';
        if (epubContainer) epubContainer.style.cursor = '';
      } else {
        selectedHighlightColor = color;
        btn.classList.add("active");
        console.log("Highlighting enabled with color:", selectedHighlightColor);
        const colorEmojis = { yellow: "💛", blue: "💙", green: "💚", orange: "🧡", pink: "💗" };
        showToast(`${colorEmojis[color]} Highlight mode activated! Select text to highlight.`);
        
        // Add visual cursor change
        const pdfView = $('pdfView');
        const epubContainer = $('epubContainer');
        if (pdfView) pdfView.style.cursor = 'text';
        if (epubContainer) epubContainer.style.cursor = 'text';
      }
    });
  });

  // Text selection for highlighting
  document.addEventListener("mouseup", (e) => {
    if (!currentBook || !currentBook.id) return;
    
    // Only trigger in reader areas
    const inReader = e.target.closest('#pdfView') || 
                     e.target.closest('#epubContainer') || 
                     e.target.closest('.pdf-text-layer');
    
    if (!inReader) return;
    
    const selection = window.getSelection();
    const text = selection.toString().trim();
    
    console.log("Text selected:", text.substring(0, 50));
    console.log("Highlight color active:", selectedHighlightColor);
    
    if (text.length > 0 && selectedHighlightColor) {
      const currentPage = currentPdfPage || 1;
      console.log("Adding highlight on page", currentPage);
      
      // Create visual highlight overlay
      const range = selection.getRangeAt(0);
      const span = document.createElement('span');
      span.className = `highlight-overlay highlight-${selectedHighlightColor}`;
      span.dataset.highlightId = Date.now();
      
      try {
        range.surroundContents(span);
      } catch (e) {
        // Fallback for complex selections
        const contents = range.extractContents();
        span.appendChild(contents);
        range.insertNode(span);
      }
      
      addHighlight(currentBook.id, currentPage, text, selectedHighlightColor);
      
      const colorEmojis = { yellow: "💛", blue: "💙", green: "💚", orange: "🧡", pink: "💗" };
      showToast(`${colorEmojis[selectedHighlightColor]} Text highlighted! Press Ctrl+Z to undo.`);
      
      // Store for undo
      if (!window.highlightHistory) window.highlightHistory = [];
      window.highlightHistory.push({ element: span, bookId: currentBook.id, page: currentPage, text, color: selectedHighlightColor });
      
      // Reset selection after a brief delay
      setTimeout(() => {
        selection.removeAllRanges();
        // Don't auto-disable highlight mode - keep it active for multiple highlights
      }, 300);
    } else if (text.length > 0 && !selectedHighlightColor) {
      console.log("Text selected but no highlight color active - select a highlight color first");
    }
  });

  // Note modal
  $("closeNoteBtn").addEventListener("click", () => {
    $("noteModal").classList.add("hidden");
  });

  $("cancelNoteBtn").addEventListener("click", () => {
    $("noteModal").classList.add("hidden");
  });

  $("saveNoteBtn").addEventListener("click", () => {
    const text = $("noteTextarea").value.trim();
    if (text && currentBookId) {
      const currentPage = currentPdfPage || 1;
      addNote(currentBookId, currentPage, text);
      $("noteModal").classList.add("hidden");
    } else {
      showToast("❌ Please enter a note");
    }
  });

  $("noteModal").addEventListener("click", (e) => {
    if (e.target === $("noteModal")) {
      $("noteModal").classList.add("hidden");
    }
  });

  const openProfileBtn = $("openProfileBtn");
  
  if (openProfileBtn) {
    openProfileBtn.addEventListener("click", () => {
      console.log("My Shelf button clicked");
      const panel = $("rightPanel");
      panel.classList.remove("hidden");
      panel.classList.add("open");
      renderRightPanel(); // Re-render to show correct content for guest/user
    });
  } else {
    console.error("Open profile button not found!");
  }
  
  $("closeRightPanelBtn").addEventListener("click", () => {
    $("rightPanel").classList.remove("open");
    $("rightPanel").classList.add("hidden");
  });
  
  // Panel tabs switching
  document.querySelectorAll('.panel-tab').forEach(tab => {
    tab.addEventListener('click', () => {
      const tabName = tab.dataset.tab;
      
      // Update tab buttons
      document.querySelectorAll('.panel-tab').forEach(t => t.classList.remove('active'));
      tab.classList.add('active');
      
      // Show correct content
      document.querySelectorAll('.panel-tab-content').forEach(content => {
        content.classList.remove('active');
      });
      
      if (tabName === 'activity') {
        $("activityTab").classList.add("active");
      } else if (tabName === 'settings') {
        $("settingsTab").classList.add("active");
      }
    });
  });
  
  // Settings actions
  $("clearDataBtn").addEventListener("click", () => {
    if (confirm("Are you sure you want to clear all your progress, favorites, and reading data? This cannot be undone.")) {
      state.progress = {};
      state.favorites = [];
      state.recent = [];
      state.reviews = {};
      state.savedThisMonth = 0;
      state.downloadsThisMonth = 0;
      saveState();
      renderRightPanel();
      renderBooks();
      showToast("✅ All data cleared");
    }
  });
  
  // Sort by radio buttons
  $("sortDefault").addEventListener("change", () => {
    currentSort = "default";
    renderBooks();
  });
  $("sortRecent").addEventListener("change", () => {
    currentSort = "recent";
    renderBooks();
  });
  $("sortRating").addEventListener("change", () => {
    currentSort = "rating";
    renderBooks();
  });
  
  // More filters button
  $("moreFiltersBtn").addEventListener("click", openFiltersModal);
  $("closeFiltersBtn").addEventListener("click", closeFiltersModal);
  $("applyFiltersBtn").addEventListener("click", applyAdvancedFilters);
  $("clearFiltersBtn").addEventListener("click", clearAdvancedFilters);
  $("filtersModal").addEventListener("click", (e) => {
    if (e.target === $("filtersModal")) closeFiltersModal();
  });

  // Navigation buttons
  $("homeBtn").addEventListener("click", () => {
    // Close reader modal if open
    if (!$("readerModal").classList.contains("hidden")) {
      closeReader();
    }
    // Reset to home view
    currentGenreFilter = null;
    currentSearch = "";
    currentSort = "default";
    $("searchInput").value = "";
    $("onlyFavoritesCheckbox").checked = false;
    $("onlyInProgressCheckbox").checked = false;
    $("sortDefault").checked = true;
    // Reset ALL advanced filters, including languages
    advancedFilters = { genres: [], ratings: [], formats: [], languages: [] };
    renderGenres();
    renderBooks();
    // Make "All" genre active
    const allLi = document.querySelector(".genre-list li");
    if (allLi) {
      document.querySelectorAll(".genre-list li").forEach(li => li.classList.remove("active"));
      allLi.classList.add("active");
    }
  });
  
  $("backBtn").addEventListener("click", () => {
    // Close reader modal if open
    if (!$("readerModal").classList.contains("hidden")) {
      closeReader();
    } else {
      // Reset to home view
      currentGenreFilter = null;
      currentSearch = "";
      $("searchInput").value = "";
      $("onlyFavoritesCheckbox").checked = false;
      $("onlyInProgressCheckbox").checked = false;
      renderGenres();
      renderBooks();
      // Make "All" genre active
      const allLi = document.querySelector(".genre-list li");
      if (allLi) {
        document.querySelectorAll(".genre-list li").forEach(li => li.classList.remove("active"));
        allLi.classList.add("active");
      }
    }
  });
  
  $("forwardBtn").addEventListener("click", () => {
    // Not implemented - could be used for redo/forward navigation if needed
    showToast("Forward navigation not available");
  });

  // Auth events - removed (no authentication needed)

  // clicking outside modal
  $("readerModal").addEventListener("click", (e) => {
    if (e.target === $("readerModal")) closeReader();
  });

  // ===== ACCESSIBILITY CONTROLS =====
  const fontSizeIncrease = $("fontSizeIncrease");
  if (fontSizeIncrease) {
    fontSizeIncrease.addEventListener("click", () => {
      console.log("Font size increase clicked");
      state.accessibility.fontSize = Math.min(state.accessibility.fontSize + 2, 32);
      console.log("New font size:", state.accessibility.fontSize);
      saveState();
      applyAccessibilitySettings();
      showToast(`📏 Font size: ${state.accessibility.fontSize}px`);
    });
  }

  const fontSizeDecrease = $("fontSizeDecrease");
  if (fontSizeDecrease) {
    fontSizeDecrease.addEventListener("click", () => {
      console.log("Font size decrease clicked");
      state.accessibility.fontSize = Math.max(state.accessibility.fontSize - 2, 10);
      console.log("New font size:", state.accessibility.fontSize);
      saveState();
      applyAccessibilitySettings();
      showToast(`📏 Font size: ${state.accessibility.fontSize}px`);
    });
  }

  $("fontSizeReset").addEventListener("click", () => {
    console.log("Font size reset clicked");
    state.accessibility.fontSize = 16;
    saveState();
    applyAccessibilitySettings();
    showToast("📏 Font size reset to 16px");
  });

  // Font family controls removed

  document.querySelectorAll(".theme-btn").forEach(btn => {
    btn.addEventListener("click", () => {
      const theme = btn.dataset.theme;
      state.accessibility.theme = theme;
      saveState();
      applyAccessibilitySettings();
      document.querySelectorAll(".theme-btn").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
      const themeNames = { light: "Light", dark: "Dark", sepia: "Sepia", warm: "Warm Candlelight" };
      showToast(`Theme: ${themeNames[theme]}`);
    });
  });

  // Theme toggle buttons
  const lightThemeBtn = $("lightThemeBtn");
  const darkThemeBtn = $("darkThemeBtn");
  
  console.log('=== ACCESSIBILITY ELEMENTS CHECK ===');
  console.log('lightThemeBtn found:', !!lightThemeBtn);
  console.log('darkThemeBtn found:', !!darkThemeBtn);
  
  if (lightThemeBtn) {
    console.log('Adding click listener to light theme button');
    lightThemeBtn.addEventListener("click", () => {
      console.log('Light theme button CLICKED!');
      state.accessibility.darkMode = false;
      saveState();
      applyAccessibilitySettings();
      if (darkThemeBtn) darkThemeBtn.classList.remove('active');
      lightThemeBtn.classList.add('active');
      showToast('☀️ Light theme enabled');
    });
  } else {
    console.error('Light theme button NOT FOUND in DOM!');
  }

  if (darkThemeBtn) {
    console.log('Adding click listener to dark theme button');
    darkThemeBtn.addEventListener("click", () => {
      console.log('Dark theme button CLICKED!');
      state.accessibility.darkMode = true;
      saveState();
      applyAccessibilitySettings();
      darkThemeBtn.classList.add('active');
      if (lightThemeBtn) lightThemeBtn.classList.remove('active');
      showToast('🌙 Dark theme enabled');
    });
  } else {
    console.error('Dark theme button NOT FOUND in DOM!');
  }

  // Color blind mode
  const colorBlindMode = $("colorBlindMode");
  console.log('colorBlindMode found:', !!colorBlindMode);
  
  if (colorBlindMode) {
    console.log('Adding change listener to color blind checkbox');
    colorBlindMode.addEventListener("change", (e) => {
      console.log('Color blind checkbox CHANGED! Checked:', e.target.checked);
      state.accessibility.colorBlind = e.target.checked;
      saveState();
      applyAccessibilitySettings();
      showToast(e.target.checked ? "🎨 Color blind mode enabled" : "🎨 Color blind mode disabled");
    });
  } else {
    console.error('Color blind checkbox NOT FOUND in DOM!');
  }
  
  console.log('=== END ACCESSIBILITY ELEMENTS CHECK ===');

  // Preferences
  $("settingsAutoSave").addEventListener("change", (e) => {
    if (!state.preferences) state.preferences = {};
    state.preferences.autoSave = e.target.checked;
    saveState();
    showToast(e.target.checked ? "💾 Auto-save enabled" : "💾 Auto-save disabled");
  });

  $("settingsShowAI").addEventListener("change", (e) => {
    if (!state.preferences) state.preferences = {};
    state.preferences.showAI = e.target.checked;
    saveState();
    const widget = $('aiWidget');
    if (e.target.checked) {
      widget?.classList.remove('hidden');
      localStorage.removeItem('aiWidgetClosed');
      showToast("🤖 AI widget enabled");
    } else {
      widget?.classList.add('hidden');
      showToast("🤖 AI widget disabled");
    }
  });

  $("settingsShowRecommendations").addEventListener("change", (e) => {
    if (!state.preferences) state.preferences = {};
    state.preferences.showRecommendations = e.target.checked;
    saveState();
    showToast(e.target.checked ? "✨ Recommendations enabled" : "✨ Recommendations disabled");
  });

  $("settingsShowDailyQuote").addEventListener("change", (e) => {
    if (!state.preferences) state.preferences = {};
    state.preferences.showDailyQuote = e.target.checked;
    saveState();
    showToast(e.target.checked ? "📚 Daily quotes enabled" : "📚 Daily quotes disabled");
  });

  // Initialize redo stack
  if (!window.highlightHistory) window.highlightHistory = [];
  if (!window.highlightRedoStack) window.highlightRedoStack = [];

  // ===== KEYBOARD SHORTCUTS =====
  document.addEventListener("keydown", (e) => {
    // Undo highlight (Ctrl+Z) - works globally
    if (e.ctrlKey && e.key === 'z' && !e.shiftKey && !e.target.matches('input, textarea')) {
      if (window.highlightHistory && window.highlightHistory.length > 0) {
        e.preventDefault();
        const lastHighlight = window.highlightHistory.pop();
        if (lastHighlight.element && lastHighlight.element.parentNode) {
          const parent = lastHighlight.element.parentNode;
          while (lastHighlight.element.firstChild) {
            parent.insertBefore(lastHighlight.element.firstChild, lastHighlight.element);
          }
          lastHighlight.element.remove();
          
          // Remove from state
          const highlights = state.annotations[lastHighlight.bookId]?.highlights || [];
          const index = highlights.findIndex(h => h.page === lastHighlight.page && h.text === lastHighlight.text && h.color === lastHighlight.color);
          if (index > -1) {
            highlights.splice(index, 1);
            saveState();
          }
          
          // Add to redo stack
          window.highlightRedoStack.push(lastHighlight);
          
          showToast("◀ Undo highlight");
        }
        return;
      }
    }
    
    // Redo highlight (Ctrl+Shift+Z or Ctrl+Y) - works globally
    if ((e.ctrlKey && e.shiftKey && e.key === 'Z') || (e.ctrlKey && e.key === 'y')) {
      if (!e.target.matches('input, textarea') && window.highlightRedoStack && window.highlightRedoStack.length > 0) {
        e.preventDefault();
        const redoHighlight = window.highlightRedoStack.pop();
        
        // Re-create the highlight
        const textLayer = document.getElementById('pdf-text-layer');
        if (textLayer && redoHighlight.text) {
          // Find text in layer and re-highlight
          const walker = document.createTreeWalker(textLayer, NodeFilter.SHOW_TEXT);
          let node;
          while (node = walker.nextNode()) {
            if (node.textContent.includes(redoHighlight.text.substring(0, 20))) {
              const span = document.createElement('span');
              span.className = `highlight-overlay highlight-${redoHighlight.color}`;
              span.dataset.highlightId = Date.now();
              const parent = node.parentNode;
              parent.insertBefore(span, node);
              span.appendChild(node);
              
              redoHighlight.element = span;
              window.highlightHistory.push(redoHighlight);
              addHighlight(redoHighlight.bookId, redoHighlight.page, redoHighlight.text, redoHighlight.color);
              showToast("▶ Redo highlight");
              break;
            }
          }
        }
        return;
      }
    }
    
    // Only work when reader is open and not typing in input
    if ($("readerModal").classList.contains("hidden") || 
        e.target.tagName === "INPUT" || 
        e.target.tagName === "TEXTAREA") return;

    switch(e.key) {
      case "ArrowRight":
        e.preventDefault();
        changePage(1);
        break;
      case "ArrowLeft":
        e.preventDefault();
        changePage(-1);
        break;
      case "f":
      case "F":
        e.preventDefault();
        if (currentBookId) toggleFavorite(currentBookId);
        break;
      case "d":
      case "D":
        e.preventDefault();
        if (currentBookId && state.plan === "premium") {
          downloadBook(currentBookId);
        } else if (currentBookId) {
          showToast("❌ Download is a Premium feature");
        }
        break;
      case "Escape":
        e.preventDefault();
        closeReader();
        break;
    }
  });
}

// ===== ADVANCED FILTERS MODAL =====
function openFiltersModal() {
  $("filtersModal").classList.remove("hidden");
  
  // Populate genre checkboxes
  const genreContainer = $("genreCheckboxes");
  genreContainer.innerHTML = "";
  // Collect all unique genres from all books (from both 'genre' and 'genres' arrays)
  const allGenresSet = new Set();
  books.forEach(b => {
    if (b.genre) allGenresSet.add(b.genre);
    if (Array.isArray(b.genres)) b.genres.forEach(g => allGenresSet.add(g));
  });
  const allGenres = Array.from(allGenresSet).sort();
  allGenres.forEach(genre => {
    const label = document.createElement("label");
    label.className = "checkbox-row";
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = genre;
    checkbox.checked = advancedFilters.genres.includes(genre);
    checkbox.dataset.filterType = "genre";
    const span = document.createElement("span");
    span.textContent = genre;
    label.appendChild(checkbox);
    label.appendChild(span);
    genreContainer.appendChild(label);
  });
}

function closeFiltersModal() {
  $("filtersModal").classList.add("hidden");
}

function applyAdvancedFilters() {
  // Get selected genres
  advancedFilters.genres = Array.from(document.querySelectorAll('#genreCheckboxes input:checked')).map(cb => cb.value);
  
  // Get selected rating ranges
  advancedFilters.ratings = [];
  if ($("rating48").checked) advancedFilters.ratings.push({ min: 4.8, max: 5.0 });
  if ($("rating45").checked) advancedFilters.ratings.push({ min: 4.5, max: 4.7 });
  if ($("rating40").checked) advancedFilters.ratings.push({ min: 4.0, max: 4.4 });
  if ($("rating35").checked) advancedFilters.ratings.push({ min: 3.5, max: 3.9 });
  if ($("rating30").checked) advancedFilters.ratings.push({ min: 3.0, max: 3.4 });
  if ($("ratingBelow3").checked) advancedFilters.ratings.push({ min: 0, max: 2.9 });
  
  // Get selected formats
  advancedFilters.formats = [];
  if ($("formatPdf").checked) advancedFilters.formats.push("pdf");
  if ($("formatEpub").checked) advancedFilters.formats.push("epub");
  
  // Get selected languages
  advancedFilters.languages = [];
  if ($("langEnglish").checked) advancedFilters.languages.push("English");
  if ($("langSpanish").checked) advancedFilters.languages.push("Spanish");
  if ($("langPortuguese").checked) advancedFilters.languages.push("Portuguese");
  
  closeFiltersModal();
  renderBooks();
  showToast("Filters applied!");
}

function clearAdvancedFilters() {
  advancedFilters = {
    genres: [],
    ratings: [],
    formats: [],
    languages: []
  };
  
  // Uncheck all checkboxes
  document.querySelectorAll('#filtersModal input[type="checkbox"]').forEach(cb => cb.checked = false);
  
  closeFiltersModal();
  renderBooks();
  showToast("Filters cleared!");
}

// ===== DOWNLOAD =====
function downloadBook(bookId) {
  // Track downloads (no limits, no authentication needed)
  state.downloadsThisMonth += 1;
  saveState();
  
  // Direct download from local files
  const book = books.find(b => b.id === bookId);
  if (book && book.fileUrl) {
    // Create a download link
    const link = document.createElement('a');
    link.href = book.fileUrl;
    link.download = `${book.title}.${book.format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("✅ Download started!");
  } else {
    showToast("❌ Book file not available");
  }
}

function downloadBookFormat(bookId, format, fileUrl) {
  // Track downloads (no limits, no authentication needed)
  state.downloadsThisMonth += 1;
  saveState();
  
  // Direct download from local files
  const book = books.find(b => b.id === bookId);
  if (book && fileUrl) {
    // Create a download link
    const link = document.createElement('a');
    link.href = fileUrl;
    link.download = `${book.title}.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(`✅ Downloading ${format.toUpperCase()}...`);
  } else {
    showToast("❌ Book file not available");
  }
}

// ===== INIT =====
loadState();

document.addEventListener("DOMContentLoaded", () => {
  updateAuthUI();
  renderGenres();
  renderBooks();
  initEvents();
  
  // Initialize new features
  renderAchievements();
  renderStreak();
  checkAllAchievements();
  applyAccessibilitySettings();
  initStarRating();
  
  // Sync accessibility UI with state
  console.log('=== INITIAL ACCESSIBILITY STATE ===');
  console.log('Dark Mode:', state.accessibility.darkMode);
  console.log('Color Blind Mode:', state.accessibility.colorBlind);
  console.log('Full accessibility state:', state.accessibility);
  console.log('===================================');
  
  const lightBtn = $('lightThemeBtn');
  const darkBtn = $('darkThemeBtn');
  const colorBlindCheckbox = $('colorBlindMode');
  
  console.log('Elements found:', {
    lightBtn: !!lightBtn,
    darkBtn: !!darkBtn,
    colorBlindCheckbox: !!colorBlindCheckbox
  });
  
  // Set theme buttons
  if (state.accessibility.darkMode) {
    if (darkBtn) {
      darkBtn.classList.add('active');
      console.log('Dark button set to active');
    }
    if (lightBtn) {
      lightBtn.classList.remove('active');
      console.log('Light button set to inactive');
    }
  } else {
    if (lightBtn) {
      lightBtn.classList.add('active');
      console.log('Light button set to active');
    }
    if (darkBtn) {
      darkBtn.classList.remove('active');
      console.log('Dark button set to inactive');
    }
  }
  
  // Set color blind checkbox
  if (colorBlindCheckbox) {
    colorBlindCheckbox.checked = state.accessibility.colorBlind || false;
    console.log('Color blind checkbox set to:', colorBlindCheckbox.checked);
  }
  
  console.log('Accessibility UI initialized');
  console.log('Current body classes after init:', document.body.className);
  
  // Sync preference checkboxes with state
  if (!state.preferences) state.preferences = { autoSave: true, showAI: true, showRecommendations: true, showDailyQuote: true };
  $('settingsAutoSave').checked = state.preferences.autoSave !== false;
  $('settingsShowAI').checked = state.preferences.showAI !== false;
  $('settingsShowRecommendations').checked = state.preferences.showRecommendations !== false;
  $('settingsShowDailyQuote').checked = state.preferences.showDailyQuote !== false;
  
  // Show daily quote if enabled
  if (!state.preferences) state.preferences = { showDailyQuote: true };
  if (state.preferences.showDailyQuote !== false) {
    setTimeout(() => showDailyQuote(), 1000);
  }
  
  // Initialize AI widget visibility - Start closed by default
  const aiWidget = $('aiWidget');
  if (aiWidget) {
    // Always start hidden unless user explicitly opens it
    const wasOpen = localStorage.getItem('aiWidgetOpen');
    if (wasOpen === 'true') {
      aiWidget.classList.remove('hidden');
    } else {
      aiWidget.classList.add('hidden');
    }
  }
  
  // Update streak on page load
  if (isLoggedIn()) {
    updateStreak();
  }
});

// ===== FILTER BY GENRE FROM READER =====
function filterByGenreFromReader(genre) {
  // Close the reader
  closeReader();
  
  // Set the genre filter
  currentGenreFilter = genre;
  
  // Update genre list UI
  document.querySelectorAll(".genre-list li").forEach(li => {
    if (li.textContent === genre) {
      li.classList.add("active");
    } else {
      li.classList.remove("active");
    }
  });
  
  // Render books with the genre filter
  renderBooks();
  
  // Show toast
  showToast(`📚 Showing ${genre} books`);
  
  // Scroll to top
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

// Make function globally accessible
window.filterByGenreFromReader = filterByGenreFromReader;

// ===== SERVICE WORKER / PWA REGISTRATION =====
if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        console.log("✅ Service worker registered", reg.scope);
      })
      .catch((err) => {
        console.error("❌ Service worker registration failed:", err);
      });
  });
}
