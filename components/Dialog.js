class Dialog extends HTMLElement {
    // Paramaters
    dialogType = this.getAttribute("data-dialog-type")
    onConfirm;

    // This is safe because no part of this is dynamic
    #shadowDomHTML = `
            <style>
                @import url("/css/global.css");
            </style>
            <dialog>
                <div class="flexcontainer flexcolumn">
                    <h2></h2>
                    <p></p>
                    <span class="flexcontainer">
                        <button id="confirm" class="button small primary">Okay</button>
                        <button id="cancel" class="button">Close</button>
                    </span>
                </div>
            </dialog>
        `;

    constructor() {
        super();
    }

    connectedCallback() {
        this.shadow = this.attachShadow({ mode: "closed" });
        this.shadow.innerHTML = this.#shadowDomHTML;

        this.shadow.querySelector("dialog").addEventListener("cancel", (e) => {
            e.preventDefault();
        });

        this.shadow.querySelector("#confirm").addEventListener("click", () => {
            // this.#login();
        });

        this.shadow.querySelector("#cancel").addEventListener("click", () => {
            this.hide();
        });
    }

    show() {
        this.shadow.querySelector("dialog").showModal();
        this.shadow.querySelector("#confirm").focus();
    }

    hide() {
        this.shadow.querySelector("dialog").close();
    }



    // connectedCallback() {

    //     const form = document.createElement("form");

    //     this.text.classList.add("text");
    //     form.append(this.text);

    //     const buttons = document.createElement("div");
    //     buttons.classList.add("buttons", "flexcontainer");
    //     const flexgrow = document.createElement("span");
    //     flexgrow.classList.add("flexgrow");
    //     buttons.append(flexgrow);

    //     const cancelBtn = document.createElement("button");
    //     cancelBtn.classList.add("button");
    //     cancelBtn.textContent = "Cancel";
    //     cancelBtn.setAttribute("formmethod", "dialog");
    //     this.confirmBtn.classList.add("button", "primary");
    //     this.confirmBtn.focused = true;
    //     this.confirmBtn.textContent = this.getAttribute("data-confirm") || "Confirm";
    //     this.confirmBtn.addEventListener("click", (e) => {
    //         e.preventDefault();
    //         this.onConfirm();
    //     });

    //     buttons.append(cancelBtn, this.confirmBtn);
    //     form.append(buttons);
    //     this.dialog.append(form);

    //     const shadow = this.attachShadow({ mode: "closed" });

    //     const linkElem = document.createElement("link");
    //     linkElem.setAttribute("rel", "stylesheet");
    //     linkElem.setAttribute("href", "./css/global.css");

    //     shadow.appendChild(linkElem);
    //     shadow.appendChild(this.dialog);

    //     this.dialog.addEventListener("close", (e) => {
    //         this.remove();
    //     });
    // }

    // show() {
    //     this.dialog.showModal();
    // }

    loadingConfirm() {
        this.confirmBtn.disabled = true;
        this.confirmBtn.classList.add("loading", "small");
    }

}

window.customElements.define("confirm-dialog", Dialog);