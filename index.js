  /**
   * POST request handler gets the request body from Google Chat API,
   * makes a POST request to Google Translate API, then returns back the response to Google Chat API.
   * @param {Request} request - the incoming request to read from
   */
  async function main(request) {
    try {
    //get the request body from Google Chat API
    const reqBody = await readChatBody(request)
    //format the request body to parse to Google Translate API
    const body = formatTranslateRequest(reqBody)
    //POST request handler to Google Translate API
    const response = await postToTranslateAPI(body)
    //get results object from Google Translate API response
    const results = await getTranslateResult(response)
    //format request body to return to Google Chat API
    const chatBody = formatChatRequest(results)
    //POST request handler to return the translated result back to Google Chat
    const chatResponse = await postToChatAPI(chatBody)
    return chatResponse
    
    } catch (e) {
        console.error(e.stack)
        return `Malformed request. ${e.message}`
    }
  }
  
  addEventListener('fetch', event => {
      event.respondWith(main(event.request))
  })

  //get Google Translate API key from Workers secrets
  const key = GCP_API_KEY
  
  //construct Google Translate URL with authentication key
  const url = 'https://translation.googleapis.com/language/translate/v2?key=' + key
  
  /**
   * readChatBody reads in the incoming request body from Google Chat API and
   * parse the payload as JSON object to another function according to the request type .
   * Use await readChatBody(..) in an async function to get the string.
   * @param {Request} request - the incoming request to read from
   */
  async function readChatBody(request) {
      const body = await request.text()
      const payload = JSON.parse(body)
      switch (payload.type) {
        case "ADDED_TO_SPACE":
          return this.onAddedToSpace()
        case "REMOVED_FROM_SPACE":
          return this.onRemovedFromSpace()
        case "MESSAGE":
          return await this.onMessage(payload)
        default:
          return "Unknown message type"
    }
  }

  function getUsage() {
    return "@translate target_language sentence"
  }

  function onAddedToSpace() {
    return "Thank you for adding me! To start, type " + this.getUsage()
  }

  function onRemovedFromSpace() {
    return "Sayonara!"
  }

  async function onMessage(payload) {
    try {
      const argumentText = payload.message.argumentText.trim()
      console.log(argumentText)
      return argumentText
    } catch (e) {
        console.error(e.stack)
        return `Sorry, I can't understand that. ${e.message}`
    }
  }

  /**
   * formatTranslateRequest takes the string argument and process it into a format that
   * Google Translate API are able to process.
   * @param {string} reqBody - the incoming request body to read from
   */
  function formatTranslateRequest(reqBody) {
    try {
      //get the first value as the target language
      let target = reqBody.slice(0,3).trim()
      console.log("length: " + target.length)
      //get the second value as the message to be translated from
      let text = reqBody.slice(3)
      //if target language is not specified, assume English as default
      if (target.length != 2) {
        target = "en"
        text = reqBody.slice(0)
      }
      console.log(target, text)
  
      //construct POST body to send to Google Translate API
      const body = {
        "target": target,
        "q": text
      }
    return body
  } catch (e) {
    console.error(e.stack)
    return `Sorry, I can't understand that. ${e.message}`
  }
}

  /**
   * postToTranslateAPI is a POST request handler function that makes a Worker's subrequest
   * to Google Translate API.
   * @param {Object} body - the incoming request body to read from
   */
  async function postToTranslateAPI(body) {
    try {
    //format the POST request to send to Google Translate API
    const init = {
      body: JSON.stringify(body),
      method: 'POST',
      headers: {
        'content-type': 'application/json;charset=UTF-8',
      },
    }
    const response = await fetch(url, init)
    //console.log(response)
    return response
    } catch (e) {
        console.error(e.stack)
        return `Sorry, I can't understand that. ${e.message}`
    }
  }

   /**
   * getTranslateResult awaits and returns the response body from Google Translate API as a string.
   * Use await getTranslateResult(..) in an async function to get the response body.
   * @param {Response} response - the incoming response to read from
   */
  async function getTranslateResult(response) {
    const { headers } = response
    const contentType = headers.get('content-type')
    if (response.status == "200" && contentType.includes('application/json')) {
      return await response.json()
    } else {
      return "Failed response from Google Translate"
    }
  }

   /**
   * formatChatRequest takes the response and process it into a format that
   * Google Chat API are able to process.
   * @param {Request} results - the incoming request to read from
   */
  function formatChatRequest(results) {
    try {
      let translated = ''
      if (results.data) {
      //get translations as an array from the results object
      let [translations] = results.data.translations
      translations = Array.isArray(translations) ? translations : [translations]
    
      //construct the translations as strings to be returned
      translated = `[${translations[0].detectedSourceLanguage}] ${translations[0].translatedText}`
      } else {
        translated = "Sorry, I don't understand that. Try: " + this.getUsage()
      }

    //format the result to be returned to Google Chat API
      const chatBody = {
        text: translated
        }
      return chatBody
    } catch (e) {
        console.error(e.stack)
        return `Sorry, I don't understand that. ${e.message}`
    }
  }

   /**
   * postToChatAPI creates a response object to return the result back
   * to Google Chat API.
   * @param {Object} body - the incoming request body to read from
   */
  async function postToChatAPI(body) {
    try {
      const chatBody = JSON.stringify(body)
      const init = {
        status: 200,
        headers: {
          'Content-Type': 'application/json;charset=UTF-8',
          "Cache-Control": "no-cache"
        }
      }
      return new Response(chatBody, init)
    } catch (e) {
        console.error(e.stack)
        return `Sorry, I don't understand that. ${e.message}`
    }
  }
