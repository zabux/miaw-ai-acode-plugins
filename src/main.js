import plugin from "../plugin.json";

import axios from "axios";

const SideButton = acode.require("sideButton");
const Prompt = acode.require("prompt");
const MultiPrompt = acode.require("multiPrompt");
const Select = acode.require("select");
const selectionMenu = acode.require("selectionMenu");
const appSettings = acode.require("settings");
const alert = acode.require("alert");

const GROQ_MODELS = {
  "object": "list",
  "data": [
    {
      "id": "mixtral-8x7b-32768",
      "name": "Mixtral-8x7b",
      "object": "model",
      "owned_by": "Groq"
    },
    {
      "id": "llama2-70b-4096",
      "name": "Llama2-70b",
      "object": "model",
      "owned_by": "Groq"
    },
    {
      "id": "gemma-7b-it",
      "name": "Gemma-7b",
      "object": "model",
      "owned_by": "Groq"
    }
  ]
};

const Settings = {
  GROQ_API_KEY: "groqApikey",
  GROQ_MODEL: "groqModel",
  
  DEFAULT: {
    groqApikey: "",
    groqModel: "",
  },
};

var MODEL = {};
GROQ_MODELS.data.forEach(item => {
  MODEL[item.id] = item.name;
});

async function getGroqModels() {
  try {
    const response = await axios.get("https://api.groq.com/openai/v1/models", {
      headers: {
        "Authorization": `Bearer ${this.settings.groqApikey}`
      }
    });
    
    if (response.data && response.data.data) {
      response.data.data.forEach(item => {
        MODEL[item.id] = item.id;
      });
    }
  } catch (e) {
    console.error("Failed to fetch Groq models:", e);
  }
}

class GroqAI {
  #commands = [
    {
      name: "groq_ai",
      description: "Groq AI",
      exec: this.run.bind(this),
    },
    {
      name: "hide_groq_ai_btn",
      description: "Hide the Groq AI button",
      exec: () => this.sideButton.hide(),
    },
    {
      name: "show_groq_ai_btn",
      description: "Show the Groq button",
      exec: () => this.sideButton.show(),
    },
    {
      name: "groq_update_token",
      description: "Update Provider Token (Groq AI)",
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
    this.$pencilIcon = tag("img", {  
      className: "edit-text-generate-token",  
      src: this.baseUrl + "icon.png",  
      style: {  
        width: "20px",  
        height: "20px",  
      }  
    });  
    
    this.setupCommands();  
    this.sideButton = SideButton({  
      text: "Groq AI",  
      icon: "icon.png",  
      onclick: () => this.run(),  
      backgroundColor: "#00a67d",  
      textColor: "#fff",  
    });  
    this.sideButton.show();  
    selectionMenu.add(  
      this.transformSelectedCode.bind(this),  
      this.$pencilIcon,  
      "all",  
    );
  }

  async GroqAI(apikey, message, model) {
    try {
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
      }, 1000);
      
      const response = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model,
          messages: [
            {  
              role: "system",  
              content: "Kamu adalah AI yang hanya mengeluarkan output berupa kode saja, tanpa penjelasan, tanpa teks tambahan, tanpa pembuka atau penutup, dan tanpa format markdown. Jawabanmu harus hanya berupa kode mentah sesuai permintaan user. Dilarang mengirim file, link file, atau instruksi untuk mengunduh file dalam bentuk apapun.",  
            },  
            { role: "user", content: `File Info: ${JSON.stringify(fileInfo)}` },  
            { role: "user", content: message },  
          ],
        },
        {
          headers: {
            "Authorization": `Bearer ${apikey}`,
            "Content-Type": "application/json"
          }
        }
      );
      
      clearInterval(alwaysOnToas);  
      const result = response.data.choices[0].message.content;
      
      if (result) {  
        const { editor } = editorManager;  
        editor.session.replace(editor.getSelectionRange(), result);  
        window.toast("Kode berhasil digenerate dan ditulis.", 2000);  
      }  
    } catch (error) {  
      this.handleError(error, "Groq AI Error");  
    }
  }

  async getApiKey() {
    const model = this.settings.groqModel;
    let apikey = this.settings.groqApikey || null;

    if (apikey == null || apikey == "") {  
      let newApiKey = await MultiPrompt(  
        `Groq API key`,  
        [  
          {  
            type: "text",  
            id: "apikey",  
            required: true,  
            placeholder: `Enter your Groq API key`,  
          },  
        ],  
        "https://console.groq.com/keys",  
      );  
      console.log("getApiKey(" + newApiKey["apikey"] + ")");  
      apikey = newApiKey["apikey"];  
      this.updateSetting(  
        Settings.GROQ_API_KEY,  
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

      let model = this.settings.groqModel;  

      if (!model) {  
        await getGroqModels.call(this);
        const options = Object.entries(MODEL);  

        const selectedModel = await Select("Pilih Model", options, {  
          onCancel: () => {},  
          hideOnSelect: true,  
        });  
        model = selectedModel;  
        this.updateSetting("groqModel", model);  
      }  

      const apikey = await this.getApiKey();  
      if (!apikey) {  
        throw new Error("API key is not valid or empty");  
      }  

      const userPromt = await Prompt(  
        `Transform Selected Code (Groq AI)`,  
        "",  
        "text",  
        {  
          placeholder: `Enter a command for ${model}`,  
          require: true,  
        },  
      );  
      if (!userPromt) {  
        return;  
      }  
      const message = `${userPromt}\n${selectedText}`;  

      this.GroqAI(apikey, message, model);  
    } catch (error) {  
      this.handleError(error);  
    }
  }

  async run() {
    let model = this.settings.groqModel;

    if (!model) {  
      await getGroqModels.call(this);
      const options = Object.entries(MODEL);  

      const selectedModel = await Select("Pilih Model", options, {  
        onCancel: () => {},  
        hideOnSelect: true,  
      });  
      model = selectedModel;  
      this.updateSetting("groqModel", model);  
    }  

    try {  
      const apikey = await this.getApiKey();  
      if (!apikey) {  
        throw new Error("API key is not valid or empty!");  
      }  

      const message = await Prompt(`Groq AI (${model})`, "", "text", {  
        placeholder: "Enter a command to generate a code...",  
        required: true,  
      });  
      if (!message) {  
        return;  
      }  

      this.GroqAI(apikey, message, model);  
    } catch (error) {  
      this.handleError(error);  
    }
  }

  async updateApiKey() {
    let newApiKey = await MultiPrompt(
      "Groq API Key",
      [
        {
          type: "text",
          id: "apikey",
          required: true,
          placeholder: "Enter your Groq API key",
        },
      ],
      "https://console.groq.com/keys",
    );

    this.updateSetting(  
      "groqApikey",  
      newApiKey["apikey"],  
    );  
    window.toast("API Key Updated.", 3000);
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
          key: "groqModel",
          text: "Groq Model",
          info: "Select Groq model to use",
          value: settings.groqModel,
          select: Object.entries(MODEL),
        },
        {
          key: "groqApikey",
          text: "Groq API Key",
          info: "The API Key to use Groq AI. Get it from https://console.groq.com/keys",
          value: this.settings.groqModel,
          prompt: "Groq API Key",
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

  async destroy() {
    this.clearCommands();
    delete appSettings.value[plugin.id];
    appSettings.update(false);

    if (this.$pencilIcon) {
      this.$pencilIcon.remove();
    }
  }
}

if (window.acode) {
  const acodePlugin = new GroqAI();
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