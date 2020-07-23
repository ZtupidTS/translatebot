  /**
   * POST request handler gets the request body from Google Chat API,
   * makes a POST request to Google Translate API, then returns back the response to Google Chat API
   * @param {Request} request the incoming request to read from
   */
  async function handlePostRequest(request) {
    try {
    //get the request body from Google Chat API as a string
    const reqBody = await readRequestBody(request)
    console.log(reqBody)
    //get the first value as the target language
    let target = reqBody.slice(0,3).trim()
    console.log(target)
    if (target.length === 3) {
      return "Target language must be 2 characters"
    }
    //get the second value as the message to be translated from
    //const text = message[1]
    let text = reqBody.slice(3)
    console.log(text)
  
    //construct POST body to send to Google Translate API
    const body = {
      "target": target,
      "q": text
    }
  
    //format the POST request
    const init = {
      body: JSON.stringify(body),
      method: 'POST',
      headers: {
        'content-type': 'application/json;charset=UTF-8',
      },
    }
    const response = await fetch(url, init)
  
  //get results object from Google Translate API response
    const results = await gatherResponse(response)
  
  //get translations as an array from the results object
    let [translations] = results.data.translations
    translations = Array.isArray(translations) ? translations : [translations]
    console.log(translations)

    //construct the translations as strings to be returned
    let translated = '[' + translations[0].detectedSourceLanguage + '] ' + translations[0].translatedText
    console.log(translated)
  
  //format the result to be returned to Google Chat API
    let chatBody = {
    text: translated
    }
    return new Response(JSON.stringify(chatBody), {
      status: 200,
      headers: {
          "Content-Type": "application/json",
          "Cache-Control": "no-cache"
      }
    })
    } catch (e) {
        console.error(e.stack)
        return `Malformed request. ${e.message}`
    }
  }
  
  addEventListener('fetch', event => {
      event.respondWith(handlePostRequest(event.request))
  })
  
  /**
   * gatherResponse awaits and returns a response body as a string.
   * Use await gatherResponse(..) in an async function to get the response body
   * @param {Response} response
   */
  async function gatherResponse(response) {
    const { headers } = response
    const contentType = headers.get('content-type')
    if (contentType.includes('application/json')) {
      return await response.json()
    } else {
      console.log("non JSON data")
      return "Content type must be in JSON format"
    }
  }

  //get Google Translate API key from secrets
  const key = GCP_API_KEY
  
  //construct Google Translate URL with authentication key
  const url = 'https://translation.googleapis.com/language/translate/v2?key=' + key
  
  /**
   * readRequestBody reads in the incoming request body from Google Chat API and
   * parse the payload as JSON object to another function according to the request type 
   * Use await readRequestBody(..) in an async function to get the string
   * @param {Request} request the incoming request to read from
   */
  async function readRequestBody(request) {
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

  function onAddedToSpace() {
    return "Thank you for adding me! To start, type " + this.getUsage()
  }

  function getUsage() {
    return "@translate target_language sentence"
  }

  function onRemovedFromSpace() {
    return "Sayonara!"
  }

  async function onMessage(payload) {
    try {
      const message = payload.message.argumentText
      return message
    } catch (e) {
        console.error(e.stack)
        return `Sorry, I can't understand that. ${e.message}`
    }
  }
