const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");

const app = express();
const port = 5174;
const preUrl = "/api";
const ACCESS_TOKEN_SECRET = "youraccesstokensecret";
const REFRESH_TOKEN_SECRET = "yourrefreshtokensecret";

// 가짜 게시판 데이터
const fakeBoards = [
  {
    id: 1,
    title: "First Board",
    content: "This is the first board content",
    author: "Author1",
    createdAt: new Date(),
  },
  {
    id: 2,
    title: "Second Board",
    content: "This is the second board content",
    author: "Author2",
    createdAt: new Date(),
  },
  // 필요한 만큼 가짜 데이터를 추가하십시오.
];

app.use(
  cors({
    origin: "http://localhost:5173", // React 개발 서버 도메인
    credentials: true, // 자격 증명 허용
  })
);
app.use(cookieParser());
app.use(bodyParser.json());

let refreshTokens = [];

app.post(`${preUrl}/login`, (req, res) => {
  const { email, password } = req.body;

  // 간단한 로그인 로직 (실제 프로젝트에서는 데이터베이스와 비교해야 합니다)
  if (email === "test@example.com" && password === "test1234") {
    const user = { name: email };

    const accessToken = generateAccessToken(user);
    const refreshToken = jwt.sign(user, REFRESH_TOKEN_SECRET);
    refreshTokens.push(refreshToken);

    //res.cookie("accessToken", accessToken, { httpOnly: true, secure: true });
    res.cookie("accessToken", accessToken, { httpOnly: true }); // 개발 서버라 SSL이 아니라서 secure 옵션을 주면 안됨
    return res.json({
      success: true,
      message: "Login successful!",
      refreshToken,
    });
  } else {
    return res
      .status(401)
      .json({ success: false, message: "Invalid email or password" });
  }
});

app.post(`${preUrl}/token`, (req, res) => {
  const refreshToken = req.body.token;
  if (refreshToken == null)
    return res.sendStatus(401).json({ message: "No token provided" });
  if (!refreshTokens.includes(refreshToken)) return res.sendStatus(403);
  jwt.verify(refreshToken, REFRESH_TOKEN_SECRET, (err, user) => {
    if (err)
      return res.sendStatus(403).json({ message: "Invalid or expired token" });
    const accessToken = generateAccessToken({ name: user.name });
    //res.cookie("accessToken", accessToken, { httpOnly: true, secure: true });
    res.cookie("accessToken", accessToken, { httpOnly: true }); // 개발 서버라 SSL이 아니라서 secure 옵션을 주면 안됨
    res.json({ accessToken });
  });
});

app.post(`${preUrl}/logout`, (req, res) => {
  const refreshToken = req.body.token;
  refreshTokens = refreshTokens.filter((token) => token !== refreshToken);
  res.clearCookie("accessToken");
  res.sendStatus(204);
});

app.get(`${preUrl}/board`, authenticateToken, (req, res) => {
  res.json(fakeBoards);
});

function generateAccessToken(user) {
  return jwt.sign(user, ACCESS_TOKEN_SECRET, { expiresIn: "15m" });
}

function authenticateToken(req, res, next) {
  const token = req.cookies.accessToken;
  if (token == null) return res.sendStatus(401);

  jwt.verify(token, ACCESS_TOKEN_SECRET, (err, user) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
}

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});
