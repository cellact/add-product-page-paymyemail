import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.2.0/firebase-app.js'
    import { getAuth, sendSignInLinkToEmail } from 'https://www.gstatic.com/firebasejs/11.2.0/firebase-auth.js'

    const backButton = document.querySelector('#back');
    const inputContainer = document.querySelector('#input-container');
    const messageContainer = document.querySelector('#message-container');
    const title = document.querySelector('#title');
    const ensButton = document.querySelector('#ens');
    
    ensButton.addEventListener("click", handleClick);
    backButton.addEventListener("click", () => {
        const jsonData = {
            action: "back-to-product",
            body: {}
        };
        sendDataToNative(jsonData);
    });
    inputContainer.querySelector("input").addEventListener("input", function(){
        this.value = this.value.toLowerCase();
        const emailPattern = /^[\w.-]+@[\w.-]+\.\w+$/;
        if (emailPattern.test(this.value) || this.value.endsWith(".eth")) {
            this.classList.remove("error");
            ensButton.disabled = false;
            return
        } 
        ensButton.disabled = true;
        this.classList.add("error");

})

    async function handleClick() {
        const input = document.querySelector("input").value;
        if (!input) return;

        if (isEmail(input)) {
            try {
                await handleEmail(input);
                // Hide input container and show message container after email is sent
                inputContainer.style.display = "none"
                title.style.display = "none"

        messageContainer.style.display = "block"
                ensButton.removeEventListener("click", handleClick); // Remove event listener after successful email send
            } catch (error) {
                console.error('Error sending email:', error.message);
            }
        } else {
            handleENS(input);
            inputContainer.style.display = "none"
            title.style.display = "none"

            messageContainer.style.display = "block"
            messageContainer.querySelector("h2").textContent = "Thank you. If the ENS is valid you will receive your product automatically in a few seconds."
            ensButton.removeEventListener("click", handleClick); // Remove event listener after successful email send
        }
    }

    const firebaseConfig = {
        apiKey: "AIzaSyDqSaGjk2AxP_mYncqVbTH-i2vGdr42Gtc",
        authDomain: "arnacon-production-gcp.firebaseapp.com",
        projectId: "arnacon-production-gcp",
    };
    const app = initializeApp(firebaseConfig);

    function handleENS(ENS) {
        const jsonData = {
            action: "verify-ens",
            body: { ens: ENS }
        };
        sendDataToNative(jsonData);
    }

    function sendDataToNative(jsonData) {
        if (window.webkit && window.webkit.messageHandlers && window.webkit.messageHandlers.nativeHandler) {
            window.webkit.messageHandlers.nativeHandler.postMessage(JSON.stringify(jsonData));
        } else if (window.AndroidBridge && window.AndroidBridge.processAction) {
            console.log(JSON.stringify(jsonData));
            window.AndroidBridge.processAction(JSON.stringify(jsonData));
        } else {
            console.log("Native interface not available");
        }
    }

    async function handleEmail(email) {
        const urlParams = new URLSearchParams(window.location.search);
        const walletAddress = urlParams.get('walletAddress');
        if (!walletAddress) {
            console.log("no wallet address given");
            return;
        }

        const actionCodeSettings = {
            url: `https://proof-files.vercel.app/authentication.html?walletAddress=${walletAddress}&email=${email}`,
            handleCodeInApp: true
        };
        
        const auth = getAuth();
        await sendSignInLinkToEmail(auth, email, actionCodeSettings);
        console.log('Email sent successfully');

        const jsonData = {
            action: "email-sent",
            body: {}
        };
        sendDataToNative(jsonData);
    }

    function isEmail(email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    }