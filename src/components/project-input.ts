import {autobind as Autobind} from "../decorators/autobind.js";
import Component from "./base-component.js";
import * as Validate from "../utils/validation.js";
import {projectState} from "../state/project-state.js";

export class ProjectInput extends Component<HTMLElement, HTMLFormElement> {

    titleInputElement: HTMLInputElement;
    descriptionInputElement: HTMLInputElement;
    peopleInputElement: HTMLInputElement;

    constructor() {
        super('project-input', 'app', true, 'user-input')

        this.titleInputElement = this.element.querySelector('#title') as HTMLInputElement; // in index.html
        this.descriptionInputElement = this.element.querySelector('#description') as HTMLInputElement; // in index.html
        this.peopleInputElement = this.element.querySelector('#people') as HTMLInputElement; // in index.html

        this.configure();
    }

    configure() {

        this.element.addEventListener('submit', this.submitHandler)
    }

    renderContent() {
    }

    private gatherUserInput(): [string, string, number] | void {
        const enteredTitle = this.titleInputElement.value;
        const enteredDescription = this.descriptionInputElement.value;
        const enteredPeople = this.peopleInputElement.value;

        const titleValidatable: Validate.Validatable = {
            value: enteredTitle,
            required: true
        }

        const descriptionValidatable: Validate.Validatable = {
            value: enteredDescription,
            required: true,
            minLength: 5
        }

        const peopleValidatable: Validate.Validatable = {
            value: +enteredPeople,
            required: true,
            min: 1,
            max: 5
        }

        if (
            !Validate.validate(titleValidatable) ||
            !Validate.validate(descriptionValidatable) ||
            !Validate.validate(peopleValidatable)

        ) {
            alert('Invalid input, please try again');
            return;
        } else {
            return [enteredTitle, enteredDescription, +enteredPeople]
        }
    }


    private clearInputs() {
        this.titleInputElement.value = '';
        this.descriptionInputElement.value = '';
        this.peopleInputElement.value = '';
    }

    @Autobind
    private submitHandler(event: Event) {
        event.preventDefault();
        const userInput = this.gatherUserInput();
        if (Array.isArray(userInput)) {
            const [title, description, people] = userInput;
            projectState.addProject(title, description, people);
            this.clearInputs();
        }
    }
}
