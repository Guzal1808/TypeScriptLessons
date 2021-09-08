namespace App {
    //autobind decorator
    export function autobind(_: any, _2: string, descriptor: PropertyDescriptor) {
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
}