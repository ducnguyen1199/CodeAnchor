/**
 * Component Analyzer
 *
 * Analyzes React/TypeScript components using ts-morph
 * Extracts component name, props, dependencies, and JSDoc
 */

import { Project, SourceFile, InterfaceDeclaration, PropertySignature } from 'ts-morph';
import * as path from 'path';

/**
 * Prop metadata extracted from component
 */
export interface PropMeta {
  name: string;
  type: string;
  required: boolean;
  description?: string;
  default?: string;
}

/**
 * Complete component metadata
 */
export interface ComponentMeta {
  name: string;
  filePath: string;
  props: PropMeta[];
  dependencies: string[];
  hasJSDoc: boolean;
}

/**
 * Component analyzer using ts-morph
 */
export class ComponentAnalyzer {
  private project: Project;

  constructor(tsConfigPath?: string) {
    this.project = new Project({
      tsConfigFilePath: tsConfigPath,
      skipAddingFilesFromTsConfig: true
    });
  }

  /**
   * Analyze component file
   * @param filePath - Absolute path to component file
   * @returns Component metadata
   */
  async analyze(filePath: string): Promise<ComponentMeta> {
    try {
      // Add source file to project
      const sourceFile = this.project.getSourceFile(filePath)
        || this.project.addSourceFileAtPath(filePath);

      // Extract component name from file
      const name = this.extractComponentName(sourceFile, filePath);

      // Extract props from interface
      const props = this.extractProps(sourceFile);

      // Extract import dependencies
      const dependencies = this.extractDependencies(sourceFile);

      // Check for JSDoc documentation
      const hasJSDoc = this.hasJSDocumentation(sourceFile);

      return {
        name,
        filePath,
        props,
        dependencies,
        hasJSDoc
      };
    } catch (error) {
      throw new ComponentAnalysisError(
        `Failed to analyze component: ${filePath}`,
        error
      );
    }
  }

  /**
   * Extract component name from source file
   */
  private extractComponentName(sourceFile: SourceFile, filePath: string): string {
    // Try to find exported component
    const exportedDeclarations = sourceFile.getExportedDeclarations();

    for (const [name, declarations] of exportedDeclarations) {
      // Skip default exports initially
      if (name === 'default') continue;

      // Check if it looks like a component (PascalCase)
      if (/^[A-Z]/.test(name)) {
        return name;
      }
    }

    // Fallback to filename without extension
    const basename = path.basename(filePath);
    return basename.replace(/\.(tsx?|jsx?)$/, '');
  }

  /**
   * Extract props from Props interface
   */
  private extractProps(sourceFile: SourceFile): PropMeta[] {
    const props: PropMeta[] = [];

    // Find all interfaces
    const interfaces = sourceFile.getInterfaces();

    for (const iface of interfaces) {
      // Look for Props interface (e.g., ButtonProps, Props)
      if (iface.getName().includes('Props')) {
        props.push(...this.extractPropsFromInterface(iface));
      }
    }

    return props;
  }

  /**
   * Extract props from specific interface
   */
  private extractPropsFromInterface(iface: InterfaceDeclaration): PropMeta[] {
    const props: PropMeta[] = [];
    const properties = iface.getProperties();

    for (const prop of properties) {
      const propName = prop.getName();
      const propType = prop.getType().getText(prop);
      const isOptional = prop.hasQuestionToken();

      // Extract JSDoc description
      const jsDocs = prop.getJsDocs();
      const description = jsDocs.length > 0 && jsDocs[0]
        ? jsDocs[0].getDescription().trim()
        : undefined;

      // Try to extract default value (limited support)
      const defaultValue = this.extractDefaultValue(prop);

      props.push({
        name: propName,
        type: propType,
        required: !isOptional,
        description,
        default: defaultValue
      });
    }

    return props;
  }

  /**
   * Extract default value from prop (best effort)
   */
  private extractDefaultValue(prop: PropertySignature): string | undefined {
    // This is complex for destructured defaults
    // Return undefined for MVP, can enhance in Phase 3+
    return undefined;
  }

  /**
   * Extract import dependencies (1-level only)
   */
  private extractDependencies(sourceFile: SourceFile): string[] {
    const dependencies: string[] = [];

    const imports = sourceFile.getImportDeclarations();
    for (const imp of imports) {
      const moduleFile = imp.getModuleSpecifierSourceFile();
      if (moduleFile) {
        const filePath = moduleFile.getFilePath();

        // Only include local imports (not node_modules)
        if (!filePath.includes('node_modules') && !filePath.includes('@types')) {
          dependencies.push(filePath);
        }
      }
    }

    return dependencies;
  }

  /**
   * Check if component has JSDoc documentation
   */
  private hasJSDocumentation(sourceFile: SourceFile): boolean {
    // Check interfaces for JSDoc
    const interfaces = sourceFile.getInterfaces();
    for (const iface of interfaces) {
      if (iface.getName().includes('Props')) {
        const properties = iface.getProperties();
        for (const prop of properties) {
          const jsDocs = prop.getJsDocs();
          if (jsDocs.length > 0) {
            return true;
          }
        }
      }
    }

    // Check functions/components for JSDoc
    const functions = sourceFile.getFunctions();
    for (const fn of functions) {
      if (fn.getJsDocs().length > 0) {
        return true;
      }
    }

    // Check variable statements (which have JSDoc)
    const statements = sourceFile.getVariableStatements();
    for (const stmt of statements) {
      if (stmt.getJsDocs().length > 0) {
        return true;
      }
    }

    return false;
  }

  /**
   * Clear ts-morph project cache
   */
  clearCache(): void {
    this.project.getSourceFiles().forEach(sf => {
      this.project.removeSourceFile(sf);
    });
  }
}

/**
 * Component analysis error
 */
export class ComponentAnalysisError extends Error {
  public override cause?: unknown;

  constructor(message: string, cause?: unknown) {
    super(message);
    this.name = 'ComponentAnalysisError';
    this.cause = cause;
  }
}

/**
 * Default component analyzer instance
 */
export const componentAnalyzer = new ComponentAnalyzer();
