// ==============================================================================
// | ARCHIVO: data-auxiliar.js
// ==============================================================================
// | DESCRIPCIÓN:
// | Define las constantes y datos auxiliares/de prueba utilizados para la 
// | configuración de máquinas virtuales, específicamente las imágenes y flavors
// | disponibles para crear las VMs en la topología.
// ==============================================================================
// | CONTENIDO PRINCIPAL:
// | - IMÁGENES DISPONIBLES
// | - TIPOS DE VM (FLAVORS - RAM, vCPU, DISK)
// ==============================================================================


// ===================== IMÁGENES =====================
const AVAILABLE_IMAGES = [
    {
        id: "img-ubuntu-light",
        name: "Ubuntu Light",
        path: "/images/ubuntu-20.04.qcow2"
    },
    {
        id: "img-ubuntu-jammy",
        name: "Ubuntu Jammy",
        path: "/images/ubuntu-jammy.qcow2"
    },
    {
        id: "img-alpine",
        name: "Alpine Linux",
        path: "/images/alpine-virt.qcow2"
    },
    {
        id: "img-lubuntu",
        name: "Lubuntu Desktop",
        path: "/images/lubuntu-24.04.2-desktop-amd64.qcow2"
    },
    {
        id: "img-cirros",
        name: "CirrOS",
        path: "/images/cirros.qcow2"
    }
];

// ===================== FLAVORS =====================
const AVAILABLE_FLAVORS = [
    {
        id: "flavor-nano",
        name: "nano",
        ram: 128,
        vcpus: 1,
        disk: 1
    },
    {
        id: "flavor-micro",
        name: "micro",
        ram: 256,
        vcpus: 1,
        disk: 5
    },
    {
        id: "flavor-small",
        name: "small",
        ram: 512,
        vcpus: 1,
        disk: 10
    },
    {
        id: "flavor-medium",
        name: "medium",
        ram: 1024,
        vcpus: 2,
        disk: 10
    },
    {
        id: "flavor-large",
        name: "large",
        ram: 8192,
        vcpus: 4,
        disk: 40
    }
];

export { AVAILABLE_IMAGES, AVAILABLE_FLAVORS };