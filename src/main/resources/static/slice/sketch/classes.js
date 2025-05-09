// ==============================================================================
// | ARCHIVO: classes.js
// ==============================================================================
// | DESCRIPCIÓN:
// | Contiene la definición de clases utilizadas tanto en el backend para la 
// | lógica del sistema como en la visualización de la topología.
// ==============================================================================
// | CONTENIDO PRINCIPAL:
// | - Clases para gestionar las máquinas virtuales, enlaces e interfaces.
// | - Estructuras para representar gráficamente la topología en el frontend.
// ==============================================================================


// ===================== CLASES BACKEND =====================
class Image {
    constructor(id, name, path) {
        this.id = id;
        this.name = name;
        this.path = path;
    }
}

class Flavor {
    constructor(id, name, ram, vcpus, disk) {
        this.id = id;
        this.name = name;
        this.ram = ram;
        this.vcpus = vcpus;
        this.disk = disk;
    }
}

class VM {
    constructor(id, name, image_id, flavor_id, slice_id = null, status = null) {
        this.id = id;
        this.name = name;
        this.image_id = image_id;
        this.flavor_id = flavor_id;
        this.slice_id = slice_id;
        this.status = status;
    }
}

class Link {
    constructor(id, name) {
        this.id = id;
        this.name = name;
    }
}

class Slice {
    constructor(id, name, description, user_id, status = null) {
        this.id = id;
        this.name = name;
        this.description = description;
        this.user_id = user_id;
        this.status = status;
    }
}

class Interface {
    external_access = false; 

    constructor(id, name, vm_id, link_id, mac_address, external_access) {
        this.id = id;
        this.name = name;
        this.vm_id = vm_id;
        this.link_id = link_id;
        this.mac_address = mac_address;
        this.external_access = external_access === true;
    }

    get external_access() {
        return this.external_access;
    }

    set external_access(value) {
        this.external_access = value === true;
    }

    toJSON() {
        return {
            id: this.id,
            name: this.name,
            vm_id: this.vm_id,
            link_id: this.link_id,
            mac_address: this.mac_address,
            external_access: this.external_access
        };
    }
}

// ===================== CLASES GRÁFICAS =====================
class VisVM {
    constructor(vm,title) {
        this.id = vm.id;
        this.label = vm.name;
        this.title = title == null ? this.generateTitle(vm) : title;
    }

    generateTitle(vm) {
        return `Name: ${vm.name}
        Image: ${vm.image_id}
        Flavor: ${vm.flavor_id}`;
    }

}

class VisLink {
    constructor(link, sourceVM, targetVM) {
        this.id = link.id;
        this.from = sourceVM.id;
        this.to = targetVM.id;
        this.label = link.name;
        this.title = this.generateTitle(link);
    }

    generateTitle(link) {
        return `Name: ${link.name}`;
    }
}

// ===================== CLASE DEL MANAGER =====================
class TopologyManager {
    constructor() {
        // Objetos del Backend 
        this.vms = new Map();       
        this.links = new Map();     
        this.interfaces = new Map(); 
        
        // Objetos de la gráfica
        this.visNodes = new Map();
        this.visEdges = new Map();
    }

    addVM(vm,title) {
        this.vms.set(vm.id, vm);
        this.visNodes.set(vm.id, new VisVM(vm,title));
    }

    addInterface(interfaceData) {
        const iface = new Interface(
            interfaceData.id,
            interfaceData.name,
            interfaceData.vm_id,
            interfaceData.link_id,
            interfaceData.mac_address,
            interfaceData.external_access
        );
        this.interfaces.set(iface.id, iface);
        return iface;
    }

    addLink(link, sourceVM, targetVM) {
        this.links.set(link.id, link);
        this.visEdges.set(link.id, new VisLink(link, sourceVM, targetVM));
    }

    removeVM(vmId) {
        const vm = this.vms.get(vmId);
        if (!vm) return;
        const vmInterfaces = Array.from(this.interfaces.values())
            .filter(iface => iface.vm_id === vmId);
        const connectedLinks = new Set(vmInterfaces
            .map(iface => iface.link_id)
            .filter(linkId => linkId !== null));
        vmInterfaces.forEach(iface => {
            this.interfaces.delete(iface.id);
        });
        connectedLinks.forEach(linkId => {
            this.links.delete(linkId);
            this.visEdges.delete(linkId);
        });
        this.vms.delete(vmId);
        this.visNodes.delete(vmId);
    }
    
    removeLink(linkId) {
        const link = this.links.get(linkId);
        if (!link) return;
        const linkInterfaces = Array.from(this.interfaces.values())
            .filter(iface => iface.link_id === linkId);
        linkInterfaces.forEach(iface => {
            this.interfaces.delete(iface.id);
        });
        this.links.delete(linkId);
        this.visEdges.delete(linkId);
    }
    
    removeExternalAccess(vmId) {
        const vm = this.vms.get(vmId);
        if (!vm) return;
        const externalInterface = Array.from(this.interfaces.values())
            .find(iface => iface.vm_id === vmId && iface.external_access);
        if (!externalInterface) return;
        if (externalInterface.link_id) {
            this.removeLink(externalInterface.link_id);
        }
        this.interfaces.delete(externalInterface.id);
        if (vm) {
            this.visNodes.set(vmId, new VisVM(vm));
        }
    }

    hasExternalAccess(vmId) {
        return Array.from(this.interfaces.values())
            .some(iface => iface.vm_id === vmId && iface.external_access === true);
    }

    getConnectedElements(vmId) {
        const interfaces = Array.from(this.interfaces.values())
            .filter(iface => iface.vm_id === vmId);
        const links = interfaces
            .map(iface => this.links.get(iface.link_id))
            .filter(link => link !== undefined);
    
        return { interfaces, links };
    }

    generateUUID() {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            const r = Math.random() * 16 | 0;
            const v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    getLinkInterfaces(linkId) {
        return Array.from(this.interfaces.values())
            .filter(iface => iface.link_id === linkId);
    }

    getVMInterfacesCount(vmId) {
        return Array.from(this.interfaces.values())
            .filter(iface => iface.vm_id === vmId)
            .length;
    }

    getNextInterfaceName(vmId) {
        const existingInterfaces = Array.from(this.interfaces.values())
            .filter(iface => iface.vm_id === vmId);
        return `eth${existingInterfaces.length}`;
    }

    getVMByInterfaceId(interfaceId) {
        const interface_obj = this.interfaces.get(interfaceId);
        return interface_obj ? this.vms.get(interface_obj.vm_id) : null;
    }
}

export { Image, Flavor, VM, Link, Interface, Slice, TopologyManager, VisVM, VisLink };