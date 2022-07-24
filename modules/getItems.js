const axios = require('axios');
const cheerio = require('cheerio');

// 検索結果を取得
module.exports = async (inputKeyword, res) => {
  // 検索結果表示
  const baseURL = 'https://search.rakuten.co.jp/search/mall/';

  const encodeKeyword = encodeURI(inputKeyword.replace(/\s/g, '+'));
  console.log('encodeKeyword：' + encodeKeyword);

  const data = [];

  try {
    const response = await axios.get(baseURL + encodeKeyword);
    console.log('response：' + baseURL + encodeKeyword);

    const htmlParser = response.data;
    console.log("response.data" + response.data)
    let allNum = 0;
    let displayNum = 0;
    let displayAllPage = 0;
    let displayTargetNum = 1;
    const $ = cheerio.load(htmlParser);

    // 1ページあたりの表示数
    displayNum = $('.searchresultitem').length;

    if (!displayNum) {
      throw new Error('楽天からデータがうまく取得できませんでした。');
    }

    // ページャーの数取得
    $('.count._medium', htmlParser).each((i, eml) => {
      allNum = $(eml)
        .text()
        .match(/.*\（(.*?)\）/)[1]
        .replace('件', '');

      displayAllPage = Math.ceil(allNum / displayNum);
    });

    do {
      const responsePage = await axios.get(
        `${baseURL}${encodeKeyword}?p=${displayTargetNum}`
      );
      console.log(
        'doWhile：' + `${baseURL}${encodeKeyword}?p=${displayTargetNum}`
      );

      const htmlParserPage = responsePage.data;
      const $ = cheerio.load(htmlParserPage);

      $('.searchresultitem', htmlParserPage).each((i, eml) => {
        const title = $(eml).find('h2').text();

        const itemUrl = $(eml).find('a').attr('href');
        const itemImg = $(eml).find('.image').find('a').find('img').attr('src');
        const price = $(eml)
          .find('.important')
          .text()
          .replace('円', '')
          .replace(',', '');

        let shipping = $(eml).find('.shipping');
        if (shipping == '') {
          // 送料無料
          shipping = $(eml).find('.-shipping').text();
        } else {
          // 送料を格納
          shipping = shipping.text().replace(/\+送料(\d*)円/, '$1');
          shipping = shipping.replace('*', '');
        }
        const points = $(eml).find('.points').text();

        let pay = Number(price) + Number(shipping);

        if (isNaN(pay)) {
          pay = price;
        }

        data.push({ title, itemImg, price, pay, shipping, points, itemUrl });
      });

      displayTargetNum = displayTargetNum + 1;
    } while (displayAllPage >= displayTargetNum);

    // 検索結果表示
    res.render('result', { data, allNum, inputKeyword });
  } catch (e) {
    console.error(e.message);
    // エラーが発生した場合
    res.render('errorpage', { message: 'エラーが発生しました。' });
  }
};
