
import { MenuUtilities } from './menu_utilities';

export interface AlertSpec {

  /** title displayed on the left-hand side */
  title?: string;

  /** main text */
  message: string;

  /** 
   * array of button labels. clicked label will be 
   * returned. defaults to a single OK button. 
   */
  buttons?: string[];

  /** disable escape key */
  disable_escape?: boolean;

}

const AlertTemplate = `
  <div class='alert_container'>
    <div class='alert_title'></div> 
    <div class='alert_message'></div> 
    <div class='alert_buttons'></div> 
  </div>
`;

/** 
 * one-line mini dialog. alert is always modal. 
 * FIXME: consolidate with dialog
 */
export class Alert {

  private static container_node_: HTMLElement;
  private key_listener_: EventListenerObject;
  private click_listener_: EventListenerObject;
  private spec_: AlertSpec;

  private static EnsureNodes() {
    if (this.container_node_) return;
    this.container_node_ = document.createElement("div");
    this.container_node_.classList.add("alert_overlay");
    this.container_node_.innerHTML = AlertTemplate;
    document.body.appendChild(this.container_node_);
  }
 
  private DelayResolution(resolve:Function, data:any){
    setTimeout(() => { 
      this.Hide(); 
      resolve(data);
    }, 1 );
  }

  /** 
   * shows an alert. returns a promise that will resolve on a button 
   * click or (optionally) pressing escape. FIXME: return key?
   */
  public Show(spec:AlertSpec) {

    MenuUtilities.Disable();
    Alert.EnsureNodes();

    return new Promise((resolve, reject) => {

      Alert.container_node_.querySelector(".alert_title").textContent = spec.title || "";
      Alert.container_node_.querySelector(".alert_message").innerHTML = spec.message || "";

      let button_text = "<button>OK</button>";
      if(spec.buttons && spec.buttons.length){
        button_text = spec.buttons.map(label => `<button>${label}</button>`).join("\n");
      }
      Alert.container_node_.querySelector(".alert_buttons").innerHTML = button_text || "";

      Alert.container_node_.style.display = "flex";

      this.key_listener_ = {
        handleEvent: (event) => {
          if(!spec.disable_escape){
            if ((event as KeyboardEvent).key === "Escape") {
              this.DelayResolution(resolve, { reason: "escape_key", data: null });
            }
          }
        }
      };
      document.addEventListener("keydown", this.key_listener_);

      this.click_listener_ = {
        handleEvent: (event) => {
          let target = event.target as HTMLElement;
          if (/button/i.test(target.tagName || "")) {
            this.DelayResolution(resolve, { reason: "button", data: target.textContent });
          }
        }
      };
      Alert.container_node_.addEventListener("click", this.click_listener_);
      this.spec_ = spec;

    });

  }

  /** 
   * closes the alert
   */
  private Hide() {
    Alert.container_node_.style.display = "none";
    if (this.key_listener_) {
      console.info("Remove kl");
      document.removeEventListener("keydown", this.key_listener_);
      this.key_listener_ = null;
    }
    if (this.click_listener_) {
      console.info("Remove cl");
      Alert.container_node_.removeEventListener("click", this.click_listener_);
    }
    this.spec_ = null;
    MenuUtilities.Enable();
  }

}