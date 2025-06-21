import { ZodError } from "zod";
import { type StringKeyObj } from "../types/interfaces";
import DomRender from "../lib/DomRender";
import { isArrayofObjects, isObject, trimKeyValues } from "../utils/helpers";
import { type Component, type StatefulComponent } from "./settingsTypes";

type SettingsSectionProps<T> = {
  title: string;
  state: T;
  sectionEl: HTMLElement;
  onSave: (data: any) => void;
  render: () => void;
  rerender: () => void;
};
export default class SettingsSection<T> implements StatefulComponent<T> {
  readonly title: string;
  state: T;
  _defaultState: T;
  readonly sectionEl: HTMLElement;
  onSave: (data: any) => void;
  render: () => void;
  rerender: () => void;

  constructor({
    title,
    state,
    sectionEl,
    onSave,
    render,
    rerender,
  }: SettingsSectionProps<T>) {
    this.title = title;
    this.state = state;
    this._defaultState = JSON.parse(JSON.stringify(state));
    this.sectionEl = sectionEl;
    this.onSave = onSave;
    this.rerender = rerender;
    this.render = render;
  }

  save() {
    try {
      if (this.state && isObject(this.state)) trimKeyValues(this.state);
      else if (typeof this.state === "string")
        this.state = this.state.trim() as unknown as T;
      else if (isArrayofObjects(this.state))
        this.state.forEach((obj: StringKeyObj) => trimKeyValues(obj));

      this.onSave(this.state);
      this._defaultState = this.state;
      this.displaySuccessMsg();
      this.sectionEl.classList.remove("error");
      this.rerender();
    } catch (e) {
      const error = e as Error;
      if (e instanceof ZodError) {
        let msg = "";
        e.issues.forEach((error) => (msg += `\n${error.message}`));
        this.displayFailedMsg(msg);
      } else if (error.message === "The quota has been exceeded.") {
        this.displayFailedMsg("The image is too large.");
      } else this.displayFailedMsg(error.message || undefined);

      this.sectionEl.classList.add("error");
    }
  }

  displayFailedMsg(msg?: string) {
    const msgEl = this.sectionEl.querySelector(".msg") as HTMLElement;
    msg = msg || "failed, localStorage is turned off or full";
    DomRender.displayMsg(msgEl, msg);
  }

  hideMsg() {
    const msgEl = this.sectionEl.querySelector(".msg") as HTMLElement;
    msgEl.classList.add("hide");
  }

  displaySuccessMsg() {
    const msgEl = this.sectionEl.querySelector(".msg") as HTMLElement;
    DomRender.displayMsg(msgEl, `successfully saved your ${this.title}`);
    setTimeout(() => {
      msgEl.classList.add("hide");
    }, 3000);
  }

  reset() {
    this.state = JSON.parse(JSON.stringify(this._defaultState));
    const msgEl = this.sectionEl.querySelector(".msg") as HTMLElement;
    msgEl.classList.add("hide");
    this.sectionEl.classList.remove("error");
  }
}

interface SettingsSectionWithChildrenProps<T>
  extends Omit<SettingsSectionProps<T>, "render" | "rerender"> {
  children: Component[];
  save?: () => void;
}
export class SettingsSectionWithChildren<T> extends SettingsSection<T> {
  readonly title: string;
  state: T;
  _defaultState: T;
  readonly sectionEl: HTMLElement;
  children: Component[];
  onSave: (data: any) => void;

  constructor({
    title,
    state,
    sectionEl,
    children = [],
    onSave,
  }: SettingsSectionWithChildrenProps<T>) {
    super({
      title,
      state,
      sectionEl,
      onSave,
      render: () => {},
      rerender: () => {},
    });
    this.title = title;
    this.state = state;
    this._defaultState = JSON.parse(JSON.stringify(state));
    this.sectionEl = sectionEl;
    this.children = children;
    this.onSave = onSave;
    this.render = function () {
      this.children.forEach((child) => {
        if (Array.isArray(this.state)) child.render();
        else child.render();
      });
      this.sectionEl
        .querySelector("button[type='submit']")
        ?.addEventListener("click", (e) => {
          e.preventDefault();
          this.save();
        });

      const resetButton = this.sectionEl.querySelector(
        "button[aria-label='reset']"
      );
      resetButton?.addEventListener("click", () => {
        this.reset();
        this.rerender();
      });
    };
    this.rerender = function () {
      this.children.forEach((child) => {
        if (Array.isArray(this.state)) child.rerender();
        else child.rerender();
      });
    };
  }
}
