const token = document.getElementById('token').value
console.log(token)
chrome.storage.sync.set({'token': token})
window.close()
