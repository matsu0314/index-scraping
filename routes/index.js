const express = require('express');
const router = express.Router();

const getItems = require('../modules/getItems');

router.get('/', (req, res) => {
  res.render('index');
});

router.post('/', (req, res) => {
  const inputKeyword = req.body.researchItem;

  // 検索結果取得
  getItems(inputKeyword, res);
});

module.exports = router;
