"use client";

import * as React from "react";
import { Menu as MenuPrimitive } from "@base-ui/react/menu";

export function DropdownMenu({ modal = false, ...props }: MenuPrimitive.Root.Props) {
  return <MenuPrimitive.Root data-slot="dropdown-menu" modal={modal} {...props} />;
}

export function DropdownMenuPortal({ ...props }: MenuPrimitive.Portal.Props) {
  return <MenuPrimitive.Portal data-slot="dropdown-menu-portal" {...props} />;
}

export function DropdownMenuTrigger({ ...props }: MenuPrimitive.Trigger.Props) {
  return <MenuPrimitive.Trigger data-slot="dropdown-menu-trigger" {...props} />;
}

export function DropdownMenuGroup({ ...props }: MenuPrimitive.Group.Props) {
  return <MenuPrimitive.Group data-slot="dropdown-menu-group" {...props} />;
}

export function DropdownMenuSub({ ...props }: MenuPrimitive.SubmenuRoot.Props) {
  return <MenuPrimitive.SubmenuRoot data-slot="dropdown-menu-sub" {...props} />;
}

export function DropdownMenuRadioGroup({ ...props }: MenuPrimitive.RadioGroup.Props) {
  return <MenuPrimitive.RadioGroup data-slot="dropdown-menu-radio-group" {...props} />;
}

