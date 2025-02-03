class Dialog extends HTMLElement {
    onConfirm;
    onCancel;

    // This is safe because no part of this is dynamic
    #shadowDomHTML = `
            <style>
                @import url("/css/global.css");
            </style>
            <dialog>
                <div class="flexcontainer flexcolumn">
                    <p id="text" class="margintop"></p>
                    <span class="flexcontainer">
                        <button id="confirmBtn" class="button small primary">Okay</button>
                        <button id="cancelBtn" class="button small">Close</button>
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

        this.shadow.querySelector("#confirmBtn").addEventListener("click", (e) => {
            this.loadingBtn(e.target);
            if (this.onConfirm) {
                this.onConfirm();
            } else {
                this.hide();
            }
        });

        this.shadow.querySelector("#cancelBtn").addEventListener("click", (e) => {
            this.loadingBtn(e.target);
            if (this.onCancel) {
                this.onCancel();
            } else {
                this.hide();
            }
        });

        this.shadow.querySelector("#text").textContent = this.text;

        if (this.confirmText) {
            this.shadow.querySelector("#confirmBtn").textContent = this.confirmText;
        }

        if (this.hideConfirm) {
            this.shadow.querySelector("#confirmBtn").remove();
            // this.shadow.querySelector("#cancelBtn").classList.add("primary");
        }

        if (this.cancelText) {
            this.shadow.querySelector("#cancelBtn").textContent = this.cancelText;
        }
    }

    show() {
        this.shadow.querySelector("dialog").showModal();
        if (this.hideConfirm) {
            this.shadow.querySelector("#cancelBtn").focus();
        } else {
            this.shadow.querySelector("#confirmBtn").focus();
        }
    }

    hide() {
        this.shadow.querySelector("dialog").close();
    }

    loadingBtn(btn) {
        btn.disabled = true;
        btn.classList.add("loading");
    }

    loadingDone(btn) {
        btn.disabled = false;
        btn.classList.remove("loading");
    }

}

window.customElements.define("confirm-dialog", Dialog);