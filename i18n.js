(function(){
  const messages = {
    'zh-CN': {
      title: '炼金配方查询器',
      subtitle: '输入你的 Minecraft 世界种子，查询对应的混沌嬗变和催化剂大师配方。',
      seedPlaceholder: '输入世界种子 (文本或数字)',
      seedLabel: '世界种子',
      genButton: '生成配方',
      resultsTitle: '查询结果',
      chaosTitle: '混沌嬗变 (Chaos Transmutation)',
      chaosDesc: '使用混沌基板 (Substrate of Chaos) 时，物品会按以下规则进行配对转换：',
      mastermindTitle: '催化剂大师 (Catalyst Mastermind)',
      mastermindDesc: '每个催化剂的正确配方如下：',
      catalystLabel: '催化剂',
      chaos: '混沌',
      silicon: '硅',
      silverSpecial: '银 (特殊)',
      languageLabel: '语言',
      errorEmptySeed: '请输入世界种子。',
      // categories (display only)
      catalystNames: ['火成','草本','易挥发','晶化','金属','宝石']
    },
    'en': {
      title: 'Alchemy Recipe Finder',
      subtitle: 'Enter your Minecraft world seed to get Chaos Transmutation and Catalyst Mastermind solutions.',
      seedPlaceholder: 'Enter world seed (text or number)',
      seedLabel: 'World Seed',
      genButton: 'Generate',
      resultsTitle: 'Results',
      chaosTitle: 'Chaos Transmutation',
      chaosDesc: 'Using Substrate of Chaos, items are paired and transmuted as follows:',
      mastermindTitle: 'Catalyst Mastermind',
      mastermindDesc: 'The correct sequence for each catalyst is:',
      catalystLabel: 'Catalyst',
      chaos: 'Chaos',
      silicon: 'Silicon',
      silverSpecial: 'Silver (Special)',
      languageLabel: 'Language',
      errorEmptySeed: 'Please enter a world seed.',
      catalystNames: ['Igneous','Herbal','Volatile','Crystal','Metal','Gem']
    }
  };

  const i18n = {
    locale: (localStorage.getItem('locale') || (navigator.language || 'zh-CN')).startsWith('zh') ? 'zh-CN' : (localStorage.getItem('locale') || 'en'),
    setLocale(newLocale){
      if(!messages[newLocale]) return;
      this.locale = newLocale;
      try { localStorage.setItem('locale', newLocale); } catch(e){}
      this.applyTranslations();
      document.dispatchEvent(new CustomEvent('locale-changed', {detail:{locale:newLocale}}));
    },
    t(key){
      const dict = messages[this.locale] || messages['en'];
      return (dict && key in dict) ? dict[key] : key;
    },
    catalystName(index){
      const dict = messages[this.locale] || messages['en'];
      const arr = dict.catalystNames || [];
      return arr[index] || '';
    },
    applyTranslations(){
      const $ = (sel)=>document.querySelectorAll(sel);
      $('[data-i18n]').forEach(el=>{
        const key = el.getAttribute('data-i18n');
        el.textContent = this.t(key);
      });
      $('[data-i18n-placeholder]').forEach(el=>{
        const key = el.getAttribute('data-i18n-placeholder');
        el.setAttribute('placeholder', this.t(key));
      });
      // button value/text
      $('[data-i18n-button]').forEach(el=>{
        const key = el.getAttribute('data-i18n-button');
        if('value' in el) el.value = this.t(key);
        el.textContent = this.t(key);
      });
    }
  };

  window.i18n = i18n;
})();
