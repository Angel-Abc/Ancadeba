import { Container } from '@ioc/container'

export interface IContainerBuilder {
    build(): Container;
}

export class ContainerBuilder implements IContainerBuilder {
    public build(): Container {
        return new Container();
    }
}
