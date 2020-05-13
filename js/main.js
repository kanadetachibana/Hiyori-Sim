/* const imgRoot = "assets/cards/";
soundsRoot = "assets/sound/"
const voicesRoot = "assets/sound/voices/"; */
const imgRoot = "https://hiyoriassets.kirari.moe/cards/";
const soundsRoot = "https://hiyoriassets.kirari.moe/sound/"
const voicesRoot = "https://hiyoriassets.kirari.moe/sound/voices/";
const i18nRoot = "data/i18n/";

const displayMenu = {
	"Home" : 1,
	"CharacterSelect" : 2,
	"ConfigInfo" : 3
};
const locales = {
	"en" : "English (en)",
	"ja" : "日本語 (ja)"
};
messages = {}

//var i18n = {};
const i18n = new VueI18n({
	locale: "en",
	fallbackLocale: "ja",
	messages,
});
//Vue.component('v-select', VueSelect.VueSelect)

Howler.usingWebAudio = true;
Howler.autoUnlock = true;

var bgm = new Howl({
	src: soundsRoot + "bgm_default_01.ogg",
	loop: true,
	preload: true
});

var se_system_tap = new Howl({
	src: soundsRoot + "se_system_tap.ogg"
});

var se_system_no = new Howl({
	src: soundsRoot + "se_system_no.ogg"
});

var app = new Vue({
	el: "#ps-paris",
	i18n,
	data: {
		settings: {
			defaultCard: "hiyori", // "hiyori" = hiyori, "last" = last selected
			playBGM: true,
			playVoices: true,
			language: "en"
		},
		inited: false,
		loading: true, // Show loading screen
		currentMenu: 1,
		languages: locales,
		
		// Data
		//messages: {}, // Localization
		cardList: [],
		cardNames: {},
		mypageDialogue: {},
		dialogueSounds: [],
		currentDialogue: "",
		
		// Card stuff
		cardDisplay: false, // false = astrum, true = real
		selectedCharacter: "harusaki_hiyori",
		selectedCard: "harusaki_hiyori_rare_start",
		cardId: "pop-beast-knuckle-harusaki_hiyori_rare_start",
		astrumImg: "",
		realImg: ""
	},
	methods: {
		buttonTap: function () {
			se_system_tap.play();
		},
		buttonNo: function () {
			se_system_no.play();
		},
		openMenu: function(menu) {
			this.currentMenu = menu;
		},
		getRarity: function (card) {
			if (card.search("ssrare") >= 0)
				return "SSR";
			else if (card.search("srare") >= 0)
				return "SR";
			else if (card.search("rare") >= 0)
				return "R";
			else return "N";
		},
		onCardChange: function(event) {
			$.each(app.dialogueSounds, function(index, value) {
				value.stop();
			});
			app.selectedCard = event.target.value;
			//this.loading = true;
			this.buttonTap();
			changeCard(app.selectedCard);
			//this.currentMenu = 1;
		},
		randomCardChange: function() {
			$.each(app.dialogueSounds, function(index, value) {
				value.stop();
			});
			app.selectedCard = app.cardList[Math.floor(Math.random() * app.cardList.length)];
			this.loading = true;
			changeCard(app.selectedCard, true);
		},
		cardToggle: function() {
			app.cardDisplay = !app.cardDisplay;
		},
		playRandomDialogue: function() {
			$.each(this.dialogueSounds, function(index, value) {
				value.stop();
			});
			var random = this.currentDialogue;
			var astrumLineCount = 5;
			var realLineCount = 5;
			switch(this.selectedCard) {
				case "sakura_nozomi_ssrare_gacha019":
					astrumLineCount = 3; realLineCount = 5;
					break;
				case "hasekura_io_rare_gacha019":
				case "hojo_ayane_srare_gacha019":
				case "morichika_rin_srare_gacha018":
				case "sasaki_saren_srare_raidmedal007":
				case "tamaizumi_misaki_rare_gacha018":
					case "akane_mimi_ssrare_gacha019":
					astrumLineCount = 3; realLineCount = 3;
					break;
				default:
					astrumLineCount = 5; realLineCount = 5;
			}

			while (random == this.currentDialogue) {
				if (!this.cardDisplay) { random = Math.floor(Math.random() * Math.floor(astrumLineCount)); }
					else { random = Math.floor(Math.random() * Math.floor(realLineCount)) + astrumLineCount; }
			}
			if (this.settings.playVoices) {
				this.dialogueSounds[random].play();
			}
			//app.currentDialogue = app.mypageDialogue[random]["text"];
			this.currentDialogue = random;
		},
		playCurrentDialogueVoice: function() {
			this.dialogueSounds[this.currentDialogue].stop();
			this.dialogueSounds[this.currentDialogue].play();
		},
		imageLoaded: function(event) {
			if ((event.target.id == "card_image_astrum" && !this.cardDisplay) || (event.target.id == "card_image_real" && this.cardDisplay)) {
				setTimeout(function() {
					app.loading = false;
					app.playRandomDialogue();
				}, 100);
			}
		},
		configChanged: function() {
			var settings = this.settings;
			if (settings.playBGM === "true" && !bgm.playing()) {
				bgm.play();
			}
			else if (settings.playBGM === "false") {
				bgm.stop();
			}
			
			// I don't know how JS booleans work
			if (typeof settings.playBGM == "string") {
				settings.playBGM = (settings.playBGM == "true");
			}
			if (typeof settings.playVoices == "string") {
				settings.playVoices = (settings.playVoices == "true");
			}
			this._i18n.locale = settings.language;
			
			window.localStorage.setItem("hiyori_settingDefaultCard", settings.defaultCard);
			window.localStorage.setItem("hiyori_settingPlayBGM", settings.playBGM);
			window.localStorage.setItem("hiyori_settingPlayVoices", settings.playVoices);
			window.localStorage.setItem("hiyori_settingLanguage", settings.language);
		}
	},
	mounted() {
		var self = this
		self.cardDisplay = false;
		loadCorei18n();
		// Get card list and localization data
		$.getJSON("data/cardlist.json", function(json) {
			self.cardList = json;
		});
		$.getJSON(i18nRoot + "ja/core.json", function(json) {
			messages["ja"] = json;
			self.cardNames = json.partners;
		});
		
		// Get settings from local storage (if any)
		if (window.localStorage.getItem("hiyori_settingPlayBGM") !== null) {
			self.settings.playBGM = (window.localStorage.getItem("hiyori_settingPlayBGM") === "true");
		}
		if (window.localStorage.getItem("hiyori_settingPlayVoices") !== null) {
			self.settings.playVoices = (window.localStorage.getItem("hiyori_settingPlayVoices") === "true");
		}
		if (window.localStorage.getItem("hiyori_settingLanguage") !== null) {
			self._i18n.locale = self.settings.language = (window.localStorage.getItem("hiyori_settingLanguage"));
		}
		if (window.localStorage.getItem("hiyori_settingDefaultCard") !== null) {
			self.settings.defaultCard = (window.localStorage.getItem("hiyori_settingDefaultCard"));
		}
		if (self.settings.defaultCard == "last") {
			var localStorageSelectedCard = window.localStorage.getItem("hiyori_selectedCard");
			self.selectedCard = localStorageSelectedCard ? localStorageSelectedCard : self.selectedCard;
		}
		changeCard(self.selectedCard);
		
		// When ready
		document.onreadystatechange = () => { 
			if (document.readyState == "complete") {
				if (self.settings.playBGM) {
					bgm.play();
				}
				//self.loading = false;
				self.inited = true;
			} 
		}
	}
})

function getCharacterName(card) {
	var cardsplit = card.split('_');
	return cardsplit[0] + '_' + cardsplit[1];
}

function changeCard(card, randomWorld = false) {
	var characterName = getCharacterName(card);
	var jsonName = characterName + "/" + card + ".json"
	window.localStorage.setItem("hiyori_selectedCard", card);

	$.getJSON("data/cards/" + jsonName, function(cardJson) {
		var cardId = app.cardId = cardJson["cardId"];
		var characterImgRoot = imgRoot + characterName + "/" + cardId + "/";
		
		if (randomWorld) {
			app.cardDisplay = Math.floor(Math.random() * Math.floor(2)); // Randomize Astrum or Real World
		}
		if (app.dialogueSounds) {
			$.each(app.dialogueSounds, function(index, value) {
				value.stop();
			});
		}
		$.getJSON("data/voices/" + jsonName, function(voicesJson) {
			app.mypageDialogue = voicesJson["mypage"];
			app.dialogueSounds = [];
			$.each(voicesJson["mypage"], function(index, value) {
				var characterVoiceRoot = voicesRoot + characterName + "/" + cardId + "/";
				var voiceClip = characterVoiceRoot + value["md5"]["voice"] + ".m4a";
				app.dialogueSounds.push(new Howl({
					src: voiceClip
				}));
			});
		});
		loadCharacteri18n(characterName);
		
		app.astrumImg = characterImgRoot + cardJson["md5"]["image"]["0"] + "-mypage-10_20.jpg";
		app.realImg = self.realImg = characterImgRoot + cardJson["md5"]["image"]["1"] + "-mypage-10_20.jpg";
		app.selectedCharacter = characterName;
	});
}

function loadCorei18n() {
	$.each(locales, function(key, value) {
		if (key != "ja") {
			$.getJSON(i18nRoot + key + "/core.json", function(json) {
				messages[key] = json;
			});
		}
	});
}

function loadCharacteri18n(characterName) {
	$.each(locales, function(key, value) {
		$.getJSON(i18nRoot + key + "/" + characterName + ".json", function(json) {
			messages[key][characterName] = json;
		});
	});
}