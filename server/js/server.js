const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const { wordFinder, wordTrieStr, reverseWordTrieStr } = require("./wordFinder");

const app = express();
app.use(helmet());
app.use(cors());

// corsOptions = {
//     origin: 'http://localhost:3001',
//     optionsSuccessStatus: 200 // some legacy browsers (IE11, various SmartTVs) choke on 204
// };

app.get("/wordFinder", (req, res, next) => {
  res.send({
    wordsFound: wordFinder(req.query.letters, Number(req.query.numBlanks)),
  });
});

app.get("/wordTrieStr", (req, res, next) => {
  res.send({
    wordTrieStr: wordTrieStr,
    reverseWordTrieStr: reverseWordTrieStr,
  });
});

const PORT = 3000;
app.listen(PORT, () => console.log(`http://localhost:${PORT}`));
