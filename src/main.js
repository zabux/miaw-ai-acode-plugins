import plugin from "../plugin.json";

import OpenAI from "openai";
import axios from "axios";



const SideButton = acode.require("sideButton");
const Prompt = acode.require("prompt");
const MultiPrompt = acode.require("multiPrompt");
const Select = acode.require("select");
const selectionMenu = acode.require("selectionMenu");
const appSettings = acode.require("settings");
const alert = acode.require("alert");

let XIEX_MY_ID_API_AI_MODELS = {
  "object": "list",
  "data": [
    {
      "id": "brainxiex",
      "name": "Brainxiex Ai",
      "object": "model",
      "owned_by": "Barqah Xiex",
      "created": 1712102400,
      "description": {
        "identitas": "Ai bernama Brainxiex Ai dibuat pada 3 April 2024.",
        "pembuat": "Di Kembangkan oleh Brainxiex Development. dan pembuatnya bernama Barqah Xiex.",
        "keahlian": "Pandai dan ahli di segala hal termasuk pemrograman komputer, memasak, dan lain sebagainya."
      }
    },
    {
      "id": "miaw",
      "name": "Miaw",
      "object": "model",
      "owned_by": "Awy",
      "created": 1714694400,
      "description": {
        "identitas": "Anak kecil yang pintar bernama Miaw",
        "pembuat": "Di Kembangkan oleh Brainxiex Development. dan pembuatnya bernama Awy dan di kembangkan oleh Barqah Xiex.",
        "keahlian": "Anak yang faham tentang agama dan cocok di ajak ngobrol."
      }
    },
    {
      "id": "cecep",
      "name": "Cecep",
      "object": "model",
      "owned_by": "Barqah Xiex",
      "created": 1719964800,
      "description": {
        "identitas": "Laki-laki yang berasal dari suku Sunda Priangan bernama Cecep di buat pada 3 July 2024.",
        "pembuat": "Di Kembangkan oleh Brainxiex Development. dan pembuatnya bernama Barqah Xiex.",
        "keahlian": "Pandai dan ahli di segala hal termasuk pemrograman komputer, musik, memasak, agama, dan lain sebagainya."
      }
    },
    {
      "id": "gpt",
      "name": "BX-GPT",
      "object": "model",
      "owned_by": "ChatGPT GPT3.5 OpenAi FT Brainxiex BXGPT1",
      "created": 1722643200,
      "description": {
        "identitas": "Ai GPT bernama BX-GPT.",
        "pembuat": "Di Kembangkan oleh Brainxiex Development. dan pembuatnya bernama Barqah Xiex.",
        "keahlian": "Layaknya GPT seperti biasanya."
      }
    },
    {
      "id": "lite",
      "name": "Brainxiex GPT LITE",
      "object": "model",
      "owned_by": "Barqah Xiex",
      "created": 1727913600,
      "description": {
        "identitas": "AI LLM bernama Brainxiex GPT LITE",
        "pembuat": "Di Kembangkan oleh Brainxiex Development. dan pembuatnya bernama Barqah Xiex.",
        "keahlian": "Lebih Minim dan Cepat."
      }
    },
    {
      "id": "konita",
      "name": "Konita",
      "object": "model",
      "owned_by": "Barqah Xiex",
      "created": 1747180800,
      "description": {
        "identitas": "AI Customer Service yang ramah dan baik hati Bernama Konita.",
        "pembuat": "Dikembangkan oleh Brainxiex Development. Pembuatnya bernama Barqah Xiex.",
        "keahlian": "Ahli dalam memberikan solusi, menjawab pertanyaan, dan membantu pelanggan dengan cepat dan sopan."
      }
    }
  ]
}

const Settings = {
  Brainxiex_AI_Model: "brainxiexAIModel",
  BRAINXIEX_API_KEY: "brainxiexApikey",

  DEFAULT: {
    brainxiexAIModel: "",
    brainxiexApikey: "",
  },
};


var MODEL = {};
XIEX_MY_ID_API_AI_MODELS.data.forEach(item => {
    MODEL[item.id] = item.name;
});
async function getBrainxiexModels() {
  XIEX_MY_ID_API_AI_MODELS = await axios.get("https://xiex.my.id/api/ai/models").then(r => r.data).catch(e => XIEX_MY_ID_API_AI_MODELS);

  XIEX_MY_ID_API_AI_MODELS.data.forEach(item => {
    MODEL[item.id] = item.name;
  });
}

getBrainxiexModels();

class Brainxiex {
  #commands = [
    {
      name: "brainxiex_ai",
      description: "Brainxiex AI",
      exec: this.run.bind(this),
    },
    {
      name: "hide_brainxiex_ai_btn",
      description: "Hide the Brainxiex AI button",
      exec: () => this.sideButton.hide(),
    },
    {
      name: "show_brainxiex_ai_btn",
      description: "Show the Brainxiex button",
      exec: () => this.sideButton.show(),
    },
    {
      name: "brainxiex_update_token",
      description: "Update Provider Token (Brainxiex AI)",
      exec: this.updateApiKey.bind(this),
    },
  ];

  constructor() {
    if (!appSettings.value[plugin.id]) {
      appSettings.value[plugin.id] = Settings.DEFAULT;
      appSettings.update();
    }
  }

  setupCommands() {
    this.#commands.forEach((cmd) => {
      console.log("register command: " + cmd.name);
      editorManager.editor.commands.addCommand(cmd);
    });
  }

  clearCommands() {
    this.#commands.forEach((cmd) => {
      console.log("remove command: " + cmd.name);
      editorManager.editor.commands.removeCommand(cmd.name);
    });
  }

  async init() {
    // this.$markdownItFile = tag("script", {
    //   src: this.baseUrl + "assets/markdown-it.min.js",
    // });

    this.$pencilIcon = tag("img", {
      className: "edit-text-generate-token",
      src: this.baseUrl + "icon.png",
      style: {
        width: "20px",
        height: "20px",
      }
    });
    // document.head.append(this.$markdownItFile);
    this.setupCommands();
    this.sideButton = SideButton({
      text: "Brainxiex AI",
      icon: "icon.png",
      onclick: () => this.run(),
      backgroundColor: "#f9a8d4",
      textColor: "#fff",
    });
    this.sideButton.show();
    selectionMenu.add(
      this.transformSelectedCode.bind(this),
      this.$pencilIcon,
      "all",
    );
  }

  get mdIt() {
    if (typeof window.markdownit !== "function") {
      throw new Error("Markdown-it library is not loaded.");
    }
    return window.markdownit({
      html: false,
      xhtmlOut: false,
      breaks: false,
      linkify: false,
      typographer: false,
      quotes: "“”‘’",
      highlight: function (str) {
        editorManager.editor.insert(str);
      },
    });
  }
  
  
  
  async BrainxiexAI(apikey, message, model) {
    try {
      const openai = new OpenAI({
        apiKey: apikey,
        baseURL: 'https://xiex.my.id/api/ai',
        dangerouslyAllowBrowser: true
      });

      // Mendapatkan semua informasi file yang sedang dibuka di editor
      const { editor } = editorManager;
      const session = editor.getSession();
      const fileInfo = {
        filename: editorManager.activeFile?.name || "",
        path: editorManager.activeFile?.uri || "",
        length: session.getValue().length,
        lines: session.getLength(),
        selection: editor.getSelectedText(),
        content: session.getValue(),
      };
      const alwaysOnToas = setInterval(() => {
        window.toast("Mohon Tunggu Sebentar", 1000);
      },1000)
      const response = await openai.chat.completions.create({
        model,
        messages: [
          {
        role: "system",
        content: "Kamu adalah AI yang hanya mengeluarkan output berupa kode saja, tanpa penjelasan, tanpa teks tambahan, tanpa pembuka atau penutup, dan tanpa format markdown. Jawabanmu harus hanya berupa kode mentah sesuai permintaan user. Dilarang mengirim file, link file, atau instruksi untuk mengunduh file dalam bentuk apapun.",
          },
          { role: "user", content: `File Info: ${JSON.stringify(fileInfo)}` },
          { role: "user", content: message },
        ],
        // temperature: 0,
      });
      const result = (await response).choices[0].message.content;
      clearInterval(alwaysOnToas);
      if (result) {
        const { editor } = editorManager;
        editor.session.replace(editor.getSelectionRange(), result);
        window.toast("Kode berhasil digenerate dan ditulis.", 2000);
      }
    } catch (error) {
      this.handleError(error, "Brainxiex AI Error");
    }
  }
  async getApiKey() {
    const model = this.settings.brainxiexAIModel;
    let apikey = this.settings.brainxiexApikey||null;
   
    if (apikey == null || apikey == "") {
      let newApiKey = await MultiPrompt(
        `Brainxiex api key`,
        [
          {
            type: "text",
            id: "apikey",
            required: true,
            placeholder: `Enter your Brainxiex api key`,
          },
        ],
        "https://xiex.my.id/api",
      );
      console.log("getApiKey(" + newApiKey["apikey"] + ")");
      apikey = newApiKey["apikey"];
      this.updateSetting(
        Settings.Brainxiex_APIKEY,
        apikey,
      );
    }

    return apikey;
  }

  async transformSelectedCode() {
    try {
      const { editor } = editorManager;
      let selectedText = editor.session.getTextRange(
        editor.getSelectionRange(),
      );
      if (!selectedText) return;

      let model = this.settings.brainxiexAIModel;

      if (!model) {
        let options = Object.entries(MODEL);
        const list_model = await axios.get("https://xiex.my.id/api/ai/models")
        .then(r => r.data?.data.map(v => ([v.id,v.name]))).catch(e => Object.entries(MODEL));
        
        options = list_model

        const selectedModel = await Select("Pilih Model ID", options, {
          onCancel: () => {},
          hideOnSelect: true,
        });
        model = selectedModel;
        this.updateSetting("brainxiexAIModel", model);
      }

      const apikey = await this.getApiKey();
      if (!apikey) {
        throw new Error("Apikey is not valid or empty");
      }

      const userPromt = await Prompt(
        `Transfrom Selected Code (Brainxiex AI)`,
        "",
        "text",
        {
          placeholder: "Enter a command to (BrainxiexAI)"+MODEL[model],
          require: true,
        },
      );
      if (!userPromt) {
        return;
      }
      const message = `${userPromt}\n${selectedText}`;

      this.BrainxiexAI(apikey, message, model);
    } catch (error) {
      this.handleError(error);
    }
  }

  async run() {
    let model = this.settings.brainxiexAIModel;

    if (!model) {
      let options = Object.entries(MODEL);
      const list_model = await axios.get("https://xiex.my.id/api/ai/models")
      .then(r => r.data?.data.map(v => ([v.id,v.name]))).catch(e => Object.entries(MODEL));

      options = list_model

      const selectedModel = await Select("Pilih Model ID", options, {
        onCancel: () => {},
        hideOnSelect: true,
      });
      model = selectedModel;
      this.updateSetting("brainxiexAIModel", model);
    }

    try {
      const apikey = await this.getApiKey();
      if (!apikey) {
        throw new Error("Apikey is not valid or empty!");
      }

      const message = await Prompt(`Brainxiex AI (${model})`, "", "text", {
        placeholder: "Enter a command to generate a code...",
        required: true,
      });
      if (!message) {
        return;
      }

      this.BrainxiexAI(apikey, message, model);
    } catch (error) {
      this.handleError(error);
    }
  }

  async updateApiKey() {
    const model = this.settings.brainxiexAIModel;
    let newApiKey = await MultiPrompt(
      `Brainxiex Api Key`,
      [
        {
          type: "text",
          id: "apikey",
          required: true,
          placeholder: `Enter your Brainxiex api key`,
        },
      ],
      "https://xiex.my.id/api",
    );

    this.updateSetting(
      "brainxiexApikey",
      newApiKey["apikey"],
    );
    window.toast("Api Key Update.", 3000);
  }

  updateSetting(key, newValue) {
    this.settings[key] = newValue;
    appSettings.update();
  }

  get settings() {
    return appSettings.value[plugin.id];
  }

  get settingsObj() {
    const settings = this.settings;
    return {
      list: [
        {
          key: "brainxiexAIModel",
          text: "Brainxiex AI MODEL",
          info: "Lihat Di https://xiex.my.id/api/ai#models.",
          value: settings.brainxiexAIModel,
          select: Object.entries(MODEL),
        },
        {
          key: "brainxiexApikey",
          text: "Brainxiex Api Key",
          info: "The Api Key to used Brainxiex AI. Beli Di https://xiex.my.id/api#buy-key",
          value: this.settings.brainxiexAIModel,
          prompt: "Brainxiex Api Key",
          promptType: "text",
          promptOption: [{ require: true }],
        },
      ],
      cb: (key, value) => {
        this.settings[key] = value;
        appSettings.update();
      },
    };
  }
  handleError(error, title) {
    if (error) {
      alert(title || "Error", error.message);
    }
  }

  // get getCurrentModeName() {
  //   const { editor } = editorManager;
  //   const session = editor.getSession();
  //   const currentMode = session.getMode();
  //   const currentModeName = currentMode.$id.split("/");
  //   return currentModeName[currentModeName.length - 1];
  // }

  async destroy() {
    this.clearCommands();
    delete appSettings.value[plugin.id];
    appSettings.update(false);

    this.$markdownItFile.remove();
    this.$pencilIcon.remove();
  }
}

if (window.acode) {
  const acodePlugin = new Brainxiex();
  acode.setPluginInit(
    plugin.id,
    (baseUrl, $page, { cacheFileUrl, cacheFile }) => {
      if (!baseUrl.endsWith("/")) {
        baseUrl += "/";
      }
      acodePlugin.baseUrl = baseUrl;
      acodePlugin.init($page, cacheFile, cacheFileUrl);
    },
    acodePlugin.settingsObj,
  );
  acode.setPluginUnmount(plugin.id, () => {
    acodePlugin.destroy();
  });
}
