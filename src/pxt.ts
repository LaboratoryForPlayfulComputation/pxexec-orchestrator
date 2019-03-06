export interface PXTJson {
    name: string;
    description?: string;
    dependencies: { [k: string]: string };
    files: string[];
    features?: string[];
    targetVersions?: TargetVersions;
}

interface TargetVersions {
    target: string;
    pxt?: string;
    pxtCrowdinBranch?: string;
    targetCrowdinBranch?: string;
    tag?: string;
    branch?: string;
    commits?: string; // URL
}
