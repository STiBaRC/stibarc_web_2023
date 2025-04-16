class Dialog extends HTMLElement {
    constructor() {
        super();
    }

    dialog = document.createElement("dialog");
    text = document.createElement("slot");
    confirmBtn = document.createElement("button");
    onConfirm;

    connectedCallback() {

        const form = document.createElement("form");

        this.text.classList.add("text");
        form.append(this.text);

        const buttons = document.createElement("div");
        buttons.classList.add("buttons", "flexcontainer");
        const flexgrow = document.createElement("span");
        flexgrow.classList.add("flexgrow");
        buttons.append(flexgrow);

        const cancelBtn = document.createElement("button");
        cancelBtn.classList.add("button");
        cancelBtn.textContent = "Cancel";
        cancelBtn.setAttribute("formmethod", "dialog");
        this.confirmBtn.classList.add("button", "primary");
        this.confirmBtn.focused = true;
        this.confirmBtn.textContent = this.getAttribute("data-confirm") || "Confirm";
        this.confirmBtn.addEventListener("click", (e) => {
            e.preventDefault();
            this.onConfirm();
        });

        buttons.append(cancelBtn, this.confirmBtn);
        form.append(buttons);
        this.dialog.append(form);

        const shadow = this.attachShadow({ mode: "closed" });

        const linkElem = document.createElement("link");
        linkElem.setAttribute("rel", "stylesheet");
        linkElem.setAttribute("href", "/css/global.css");

        shadow.appendChild(linkElem);
        shadow.appendChild(this.dialog);

        this.dialog.addEventListener("close", (e) => {
            this.remove();
        });
    }

    show() {
        this.dialog.showModal();
    }

    loadingConfirm() {
        this.confirmBtn.disabled = true;
        this.confirmBtn.classList.add("loading", "small");
    }

}

window.customElements.define("confirm-dialog", Dialog);