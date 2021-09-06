/// <reference path="drag-drop-interfaces.ts" />
/// <reference path="project-model.ts" />

namespace App {
//Project type

    type Listener<T> = (items: T[]) => void;

    class State<T> {
        protected listeners: Listener<T>[] = [];

        addListener(listenerFn: Listener<T>) {
            this.listeners.push(listenerFn);
        }
    }

//Project state Management
    class ProjectState extends State<Project> {
        private project: Project[] = [];
        private static instance: ProjectState;

        private constructor() {
            super();
        }

        static getInstance() // Singleton
        {
            if (this.instance) {
                return this.instance;
            }
            this.instance = new ProjectState();
            return this.instance;
        }

        addProject(title: string, description: string, numberOfPeople: number) {
            const newProject = new Project(
                Math.random().toString(),
                title,
                description,
                numberOfPeople,
                ProjectStatus.Active
            );
            this.project.push(newProject);
            this.updateListeners();
        }

        moveProject(projectId: string, newStatus: ProjectStatus) {
            const project = this.project.find(prj => prj.id === projectId);
            if (project && project.status !== newStatus) {
                project.status = newStatus;
                this.updateListeners();
            }
        }

        private updateListeners() {
            for (const listenerFn of this.listeners) {
                listenerFn(this.project.slice()); // pass copy of array
            }
        }
    }

    const projectState = ProjectState.getInstance(); // global const

//autobind decorator
    function autobind(_: any, _2: string, descriptor: PropertyDescriptor) {
        const originalMethod = descriptor.value;
        const adjDescriptor: PropertyDescriptor = {
            configurable: true,
            get() {
                const bindFn = originalMethod.bind(this);
                return bindFn;
            }
        };
        return adjDescriptor;
    }

//Project class

    interface Validatable {
        value: string | number;
        required?: boolean; // ? - means not required (optional)
        minLength?: number;
        maxLength?: number;
        min?: number;
        max?: number;
    }

    function validate(validatableInput: Validatable) {
        let isValid = true;

        if (validatableInput.required) {
            isValid = isValid && validatableInput.value.toString().trim().length !== 0;
        }
        if (typeof validatableInput.value === 'string') {
            if (validatableInput.minLength != null) {
                isValid = isValid && validatableInput.value.length > validatableInput.minLength;
            }

            if (validatableInput.maxLength != null) {
                isValid = isValid && validatableInput.value.length < validatableInput.maxLength;
            }
        }
        if (typeof validatableInput.value === 'number') {
            if (validatableInput.min != null) {
                isValid = isValid && validatableInput.value >= validatableInput.min
            }

            if (validatableInput.max != null) {
                isValid = isValid && validatableInput.value <= validatableInput.max
            }
        }

        return isValid;
    }

    abstract class Component<T extends HTMLElement, U extends HTMLElement> {
        templateElement: HTMLTemplateElement;
        hostElement: T;
        element: U;

        constructor(templateId: string,
                    hostElementId: string,
                    insertAtStart: boolean,
                    newElementId?: string) {
            this.templateElement = document.getElementById(templateId)! as HTMLTemplateElement;
            this.hostElement = document.getElementById(hostElementId)! as T;

            const importedNode = document.importNode(this.templateElement.content, true);
            this.element = importedNode.firstElementChild as U;
            if (newElementId)
                this.element.id = newElementId;

            this.attach(insertAtStart);
        }

        private attach(insertAtBegining: boolean) {
            //before closing tag
            this.hostElement.insertAdjacentElement(
                insertAtBegining ? 'afterbegin' : 'beforeend', this.element);
        }

        abstract configure(): void;

        abstract renderContent(): void;
    }

    class ProjectItem extends Component<HTMLUListElement, HTMLLIElement>
        implements Draggable {

        private project: Project;

        constructor(hostId: string, project: Project) {
            super('single-project', hostId, false, project.id);
            this.project = project;

            this.configure();
            this.renderContent();
        }

        get persons() //this.persons wil trigger getter
        {
            if (this.project.people === 1)
                return '1 person';
            else return `${this.project.people} persons`
        }

        configure() {
            this.element.addEventListener('dragstart', this.dragStartHandler)
            this.element.addEventListener('dragend', this.dragEndHandler)
        }

        renderContent() {
            this.element.querySelector('h2')!.textContent = this.project.title;
            this.element.querySelector('h3')!.textContent = this.persons + ' assigned';
            this.element.querySelector('p')!.textContent = this.project.description;
        }

        @autobind
        dragStartHandler(event: DragEvent) {
            event.dataTransfer!.setData('text/plain', this.project.id);
            event.dataTransfer!.effectAllowed = 'move';
        }

        @autobind
        dragEndHandler(event: DragEvent) {
            console.log('DragEnd');
        }
    }

// ProjectList class
    class ProjectList extends Component<HTMLDivElement, HTMLElement>
        implements DragTarget {

        assignedProject: Project[];

        constructor(private type: 'active' | 'finished') { // class will have property "type"
            super('project-list', 'app', false, `${type}-projects`);
            this.assignedProject = [];

            this.configure();
            this.renderContent();
        }

        private renderProjects() {
            const listEl = document.getElementById(`${this.type}-project-list`)! as HTMLUListElement;
            listEl.innerHTML = '';
            for (const projItem of this.assignedProject) {
                new ProjectItem(this.element.querySelector('ul')!.id, projItem);
            }
        }

        configure() {
            this.element.addEventListener('dragover', this.dragOverHandler);
            this.element.addEventListener('dragleave', this.dragLeaveHandler);
            this.element.addEventListener('drop', this.dropHandler);

            projectState.addListener((projects: Project[]) => {
                const relevantProjects = projects.filter(prj => {
                    if (this.type === 'active') {
                        return prj.status === ProjectStatus.Active;
                    } else {
                        return prj.status === ProjectStatus.Finished;
                    }
                })
                this.assignedProject = relevantProjects;
                this.renderProjects();
            })
        }

        renderContent() {
            const listId = `${this.type}-project-list`;
            this.element.querySelector('ul')!.id = listId;
            this.element.querySelector('h2')!.textContent = this.type.toUpperCase() + ' PROJECT';
        }

        @autobind
        dragOverHandler(event: DragEvent) {
            if (event.dataTransfer && event.dataTransfer.types[0] === 'text/plain') {
                event.preventDefault();
                const listEL = this.element.querySelector('ul')!;
                listEL.classList.add('droppable');
            }
        }

        @autobind
        dragLeaveHandler(event: DragEvent) {
            const listEL = this.element.querySelector('ul')!;
            listEL.classList.remove('droppable');
        }

        @autobind
        dropHandler(event: DragEvent) {
            const prgjId = event.dataTransfer!.getData('text/plain');
            projectState.moveProject(prgjId, this.type === 'active' ? ProjectStatus.Active : ProjectStatus.Finished)
        }
    }

    class ProjectInput extends Component<HTMLElement, HTMLFormElement> {

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

            const titleValidatable: Validatable = {
                value: enteredTitle,
                required: true
            }

            const descriptionValidatable: Validatable = {
                value: enteredDescription,
                required: true,
                minLength: 5
            }

            const peopleValidatable: Validatable = {
                value: +enteredPeople,
                required: true,
                min: 1,
                max: 5
            }

            if (
                !validate(titleValidatable) ||
                !validate(descriptionValidatable) ||
                !validate(peopleValidatable)

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

        @autobind
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

    new ProjectInput();
    new ProjectList('active');
    new ProjectList('finished');
}