import {DragTarget} from "../models/drag-drop.js";
import Component from "./base-component.js";
import {Project, ProjectStatus} from "../models/project.js";
import {projectState} from "../state/project-state.js";
import {ProjectItem} from "./project-item.js";
import {autobind} from "../decorators/autobind.js";

export class ProjectList extends Component<HTMLDivElement, HTMLElement>
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