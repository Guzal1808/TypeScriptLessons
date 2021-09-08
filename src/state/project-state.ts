namespace App {

    type Listener<T> = (items: T[]) => void;

    class State<T> {
        protected listeners: Listener<T>[] = [];

        addListener(listenerFn: Listener<T>) {
            this.listeners.push(listenerFn);
        }
    }

//Project state Management
    export class ProjectState extends State<Project> {
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

    export const projectState = ProjectState.getInstance(); // global const
}