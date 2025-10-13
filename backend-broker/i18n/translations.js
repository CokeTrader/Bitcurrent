/**
 * Internationalization & Localization
 * Multi-language support for global expansion
 */

const TRANSLATIONS = {
  en: {
    // English
    'app.name': 'BitCurrent',
    'nav.trade': 'Trade',
    'nav.deposit': 'Deposit',
    'nav.dashboard': 'Dashboard',
    'trade.buy': 'Buy',
    'trade.sell': 'Sell',
    'trade.amount': 'Amount',
    'trade.price': 'Price',
    'trade.total': 'Total',
    'trade.fee': 'Fee',
    'deposit.title': 'Deposit Funds',
    'withdraw.title': 'Withdraw Funds',
    'kyc.verify': 'Verify Identity',
    'settings.security': 'Security',
    'settings.notifications': 'Notifications'
  },
  es: {
    // Spanish
    'app.name': 'BitCurrent',
    'nav.trade': 'Comerciar',
    'nav.deposit': 'Depositar',
    'nav.dashboard': 'Panel',
    'trade.buy': 'Comprar',
    'trade.sell': 'Vender',
    'trade.amount': 'Cantidad',
    'trade.price': 'Precio',
    'trade.total': 'Total',
    'trade.fee': 'Comisión'
  },
  fr: {
    // French
    'app.name': 'BitCurrent',
    'nav.trade': 'Échanger',
    'nav.deposit': 'Déposer',
    'nav.dashboard': 'Tableau de bord',
    'trade.buy': 'Acheter',
    'trade.sell': 'Vendre',
    'trade.amount': 'Montant',
    'trade.price': 'Prix',
    'trade.total': 'Total',
    'trade.fee': 'Frais'
  },
  de: {
    // German
    'app.name': 'BitCurrent',
    'nav.trade': 'Handeln',
    'nav.deposit': 'Einzahlen',
    'nav.dashboard': 'Dashboard',
    'trade.buy': 'Kaufen',
    'trade.sell': 'Verkaufen',
    'trade.amount': 'Menge',
    'trade.price': 'Preis',
    'trade.total': 'Gesamt',
    'trade.fee': 'Gebühr'
  },
  pt: {
    // Portuguese
    'app.name': 'BitCurrent',
    'nav.trade': 'Negociar',
    'nav.deposit': 'Depositar',
    'nav.dashboard': 'Painel',
    'trade.buy': 'Comprar',
    'trade.sell': 'Vender',
    'trade.amount': 'Quantidade',
    'trade.price': 'Preço',
    'trade.total': 'Total',
    'trade.fee': 'Taxa'
  },
  ja: {
    // Japanese
    'app.name': 'BitCurrent',
    'nav.trade': '取引',
    'nav.deposit': '入金',
    'nav.dashboard': 'ダッシュボード',
    'trade.buy': '買う',
    'trade.sell': '売る',
    'trade.amount': '数量',
    'trade.price': '価格',
    'trade.total': '合計',
    'trade.fee': '手数料'
  },
  zh: {
    // Chinese
    'app.name': 'BitCurrent',
    'nav.trade': '交易',
    'nav.deposit': '存款',
    'nav.dashboard': '仪表板',
    'trade.buy': '买入',
    'trade.sell': '卖出',
    'trade.amount': '数量',
    'trade.price': '价格',
    'trade.total': '总计',
    'trade.fee': '手续费'
  },
  ar: {
    // Arabic
    'app.name': 'BitCurrent',
    'nav.trade': 'تداول',
    'nav.deposit': 'إيداع',
    'nav.dashboard': 'لوحة القيادة',
    'trade.buy': 'شراء',
    'trade.sell': 'بيع',
    'trade.amount': 'الكمية',
    'trade.price': 'السعر',
    'trade.total': 'المجموع',
    'trade.fee': 'الرسوم'
  },
  hi: {
    // Hindi
    'app.name': 'BitCurrent',
    'nav.trade': 'व्यापार',
    'nav.deposit': 'जमा',
    'nav.dashboard': 'डैशबोर्ड',
    'trade.buy': 'खरीदें',
    'trade.sell': 'बेचें',
    'trade.amount': 'राशि',
    'trade.price': 'कीमत',
    'trade.total': 'कुल',
    'trade.fee': 'शुल्क'
  },
  ru: {
    // Russian
    'app.name': 'BitCurrent',
    'nav.trade': 'Торговля',
    'nav.deposit': 'Депозит',
    'nav.dashboard': 'Панель',
    'trade.buy': 'Купить',
    'trade.sell': 'Продать',
    'trade.amount': 'Количество',
    'trade.price': 'Цена',
    'trade.total': 'Итого',
    'trade.fee': 'Комиссия'
  }
};

function translate(key, locale = 'en') {
  return TRANSLATIONS[locale]?.[key] || TRANSLATIONS.en[key] || key;
}

module.exports = { TRANSLATIONS, translate };

