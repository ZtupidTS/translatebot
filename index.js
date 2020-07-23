// POST request handler
async function handlePostRequest(request) {

    let reqBody = await readRequestBody(request)
    let target = reqBody[0]
    let text = reqBody[1]
  
    //construct POST body to send to Google Translate API
    let body = {
      "target": target,
      "q": text
    }
  
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
    translations = Array.isArray(translations) ? translations : [translations];
  
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
    } else if (contentType.includes('application/text')) {
      return await response.text()
    } else if (contentType.includes('text/html')) {
      return await response.text()
    } else {
      return await response.text()
    }
  }
  
  //get Google Translate API key from secrets
  const key = GCP_API_KEY
  
  //construct Google Translate URL with authentication key
  const url = 'https://translation.googleapis.com/language/translate/v2?key=' + key
  
  /**
   * readRequestBody reads in the incoming request body
   * Use await readRequestBody(..) in an async function to get the string
   * @param {Request} request the incoming request to read from
   */
  async function readRequestBody(request) {
      const body = await request.text()
      const obj = JSON.parse(body)
      const message = obj.message.argumentText.split(':')
      console.log(message)
      return message
  }