declare module "react-google-recaptcha" {
    import * as React from "react";

    export type ReCAPTCHAValue = string | null;

    export type ReCAPTCHAProps = {
        sitekey: string;
        onChange?: (value: ReCAPTCHAValue) => void;
        theme?: "light" | "dark";
    };

    export default class ReCAPTCHA extends React.Component<ReCAPTCHAProps> {
        reset(): void;
        getValue(): ReCAPTCHAValue;
    }
}
