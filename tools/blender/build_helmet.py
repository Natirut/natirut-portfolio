"""
Procedural sci-fi android helmet for the portfolio hero.

Run headless:
  blender --background --factory-startup --python tools/blender/build_helmet.py -- \
      public/models/helmet.glb [preview_prefix] [studio.hdr]

Technique
  1. A superellipsoid skull is sliced by planar facets (cheekbones, brow,
     chin, temples) so it reads as machined hard-surface rather than a blob.
  2. The same silhouette, inset, forms a dark mechanical under-layer.
  3. Boolean cutters open the armour: a V visor, a muzzle, vents and panel
     gaps that reveal the machinery beneath.
  4. Raised plates, trims, lenses, ear modules, respirators, grilles, neon
     seams, hoses and decals are projected onto the surface with ray casts.
Everything uses plain Principled BSDF materials so it exports to glTF.
"""

import bpy
import bmesh
import math
import os
import random
import sys
from mathutils import Matrix, Vector
from mathutils.bvhtree import BVHTree

argv = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else []
OUT_GLB = os.path.abspath(argv[0]) if argv else os.path.abspath("helmet.glb")
OUT_PREVIEW = os.path.abspath(argv[1]) if len(argv) > 1 else None
HDRI = os.path.abspath(argv[2]) if len(argv) > 2 else None

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene
random.seed(7)
D = math.radians
INSET = 0.05  # armour thickness over the mechanical layer


# --------------------------------------------------------------------------
# helpers
# --------------------------------------------------------------------------

def smoothstep(a, b, x):
    t = max(0.0, min(1.0, (x - a) / (b - a)))
    return t * t * (3 - 2 * t)


def sph(az_deg, el_deg):
    """Direction on the head: az 0 = straight ahead (-Y), +az toward +X."""
    az, el = D(az_deg), D(el_deg)
    return Vector((math.sin(az) * math.cos(el), -math.cos(az) * math.cos(el), math.sin(el)))


def new_object(name, bm, mat=None):
    me = bpy.data.meshes.new(name)
    bm.to_mesh(me)
    bm.free()
    obj = bpy.data.objects.new(name, me)
    scene.collection.objects.link(obj)
    if mat:
        me.materials.append(mat)
    return obj


def apply_modifiers(obj):
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(obj.evaluated_get(dg))
    old = obj.data
    obj.modifiers.clear()
    obj.data = me
    bpy.data.meshes.remove(old)


def bevel(obj, width=0.006, segments=3, angle=30):
    m = obj.modifiers.new("bevel", "BEVEL")
    m.width = width
    m.segments = segments
    m.limit_method = "ANGLE"
    m.angle_limit = D(angle)
    m.profile = 0.6
    apply_modifiers(obj)


def shade(obj, angle=35):
    me = obj.data
    me.shade_smooth()
    try:
        me.set_sharp_from_angle(angle=D(angle))
    except AttributeError:
        pass


def frame(p, n, spin=0.0):
    """Matrix placing local +Z along normal n at point p."""
    z = n.normalized()
    ref = Vector((0, 0, 1)) if abs(z.z) < 0.9 else Vector((1, 0, 0))
    x = ref.cross(z).normalized()
    y = z.cross(x)
    m = Matrix((x, y, z)).transposed().to_4x4()
    m = m @ Matrix.Rotation(spin, 4, "Z")
    m.translation = p
    return m


def material(name, color, metallic=0.0, rough=0.5, coat=0.0, emission=None, strength=0.0):
    m = bpy.data.materials.new(name)
    try:
        m.use_nodes = True
    except Exception:
        pass
    b = m.node_tree.nodes.get("Principled BSDF")
    b.inputs["Base Color"].default_value = (*color, 1)
    b.inputs["Metallic"].default_value = metallic
    b.inputs["Roughness"].default_value = rough
    if coat:
        b.inputs["Coat Weight"].default_value = coat
        b.inputs["Coat Roughness"].default_value = 0.08
    if emission:
        b.inputs["Emission Color"].default_value = (*emission, 1)
        b.inputs["Emission Strength"].default_value = strength
    return m


# --------------------------------------------------------------------------
# materials
# --------------------------------------------------------------------------

M_ARMOR = material("Armor", (0.8, 0.81, 0.83), rough=0.28, coat=0.6)
M_ARMOR2 = material("ArmorGrey", (0.36, 0.38, 0.42), rough=0.34, coat=0.4)
M_DARK = material("DarkMetal", (0.03, 0.034, 0.042), metallic=0.85, rough=0.38)
M_GUN = material("Gunmetal", (0.13, 0.14, 0.16), metallic=1.0, rough=0.26)
M_CHROME = material("Chrome", (0.86, 0.87, 0.9), metallic=1.0, rough=0.1)
M_GLASS = material("Glass", (0.004, 0.005, 0.009), metallic=0.2, rough=0.03, coat=1.0)
M_GLOW = material("Neon", (0.0, 0.0, 0.0), emission=(0.16, 0.9, 1.0), strength=9.0)
M_LAMP = material("Lamp", (0.0, 0.0, 0.0), emission=(0.85, 0.97, 1.0), strength=12.0)
M_ACCENT = material("Accent", (1.0, 0.45, 0.03), rough=0.4)
M_HOSE = material("Hose", (0.09, 0.11, 0.42), rough=0.45, coat=0.3)


def grille_material():
    """Perforated steel: a generated hole mask exported as an alpha-clipped texture."""
    size, cell = 256, 32
    img = bpy.data.images.new("GrilleMask", size, size, alpha=True)
    px = [0.0] * (size * size * 4)
    for j in range(size):
        for i in range(size):
            ox = cell / 2 if (j // cell) % 2 else 0
            cx = ((i + ox) % cell) - cell / 2 + 0.5
            cy = (j % cell) - cell / 2 + 0.5
            hole = (cx * cx + cy * cy) < (cell * 0.36) ** 2
            k = (j * size + i) * 4
            px[k : k + 4] = (0.45, 0.47, 0.5, 0.0 if hole else 1.0)
    img.pixels.foreach_set(px)
    img.pack()
    m = material("Grille", (0.45, 0.47, 0.5), metallic=1.0, rough=0.32)
    nt = m.node_tree
    b = nt.nodes.get("Principled BSDF")
    tex = nt.nodes.new("ShaderNodeTexImage")
    tex.image = img
    rnd = nt.nodes.new("ShaderNodeMath")
    rnd.operation = "ROUND"
    nt.links.new(tex.outputs["Color"], b.inputs["Base Color"])
    nt.links.new(tex.outputs["Alpha"], rnd.inputs[0])
    nt.links.new(rnd.outputs[0], b.inputs["Alpha"])
    return m


M_GRILLE = grille_material()


# --------------------------------------------------------------------------
# skull silhouette
# --------------------------------------------------------------------------

def head_shape(v):
    x, y, z = v
    x = math.copysign(abs(x) ** 0.8, x)           # flatter sides
    jaw = smoothstep(-0.25, -1.0, z)               # 0 down to the cheekbones, 1 at the chin
    low = smoothstep(0.1, -0.9, z)
    back = smoothstep(-0.1, 0.9, y)                # 1 at the back of the skull
    x *= 0.74 * (1 - 0.16 * jaw)
    y *= 0.96 * (1 - 0.18 * low) * (1 + 0.18 * back * (1 - low))
    if y < 0:
        y *= 0.86
    z *= 0.98 if z > 0 else 1.12
    z += 0.12 * back * (1 - low)                   # swept-back crown
    return Vector((x, y, z))


def base_bm(u=192, v=128):
    bm = bmesh.new()
    bmesh.ops.create_uvsphere(bm, u_segments=u, v_segments=v, radius=1.0)
    for vert in bm.verts:
        vert.co = head_shape(vert.co)
    return bm


FACETS = [  # (normal, how deep the facet bites into the silhouette)
    ((1, 0.04, 0.1), 0.13), ((-1, 0.04, 0.1), 0.13),                 # flat temples
    ((0.72, -0.6, -0.35), 0.12), ((-0.72, -0.6, -0.35), 0.12),       # cheekbones
    ((0.6, -0.62, 0.5), 0.08), ((-0.6, -0.62, 0.5), 0.08),           # brow corners
    ((0, -0.74, 0.67), 0.05),                                         # forehead
    ((0.55, -0.5, -0.67), 0.12), ((-0.55, -0.5, -0.67), 0.12),       # chin sides
    ((0, -0.3, -0.95), 0.1),                                          # chin
    ((0, 0.25, -1), 0.13),                                            # jaw underside
    ((0, -1, 0), 0.07),                                               # face plane
    ((0.55, 0.62, -0.56), 0.1), ((-0.55, 0.62, -0.56), 0.1),         # rear jaw
    ((0.7, 0.6, 0.38), 0.06), ((-0.7, 0.6, 0.38), 0.06),             # rear cranium
    ((0, 0.72, 0.7), 0.04),                                           # crown
]

_ref = base_bm(96, 64)
FACET_PLANES = []
for n, depth in FACETS:
    n = Vector(n).normalized()
    support = max(v.co.dot(n) for v in _ref.verts)
    FACET_PLANES.append((n, support - depth))
_ref.free()

collections = {}


def cutter_collection(key):
    coll = bpy.data.collections.new(key)
    scene.collection.children.link(coll)
    collections[key] = coll
    return coll


def put_cutter(coll, bm, matrix):
    obj = new_object("cut", bm)
    scene.collection.objects.unlink(obj)
    coll.objects.link(obj)
    obj.matrix_world = matrix
    return obj


def facet_cutters(coll, inset):
    for n, d in FACET_PLANES:
        bm = bmesh.new()
        bmesh.ops.create_cube(bm, size=6.0)
        put_cutter(coll, bm, frame(n * (d - inset + 3.0), n))


def boolean_cut(obj, coll):
    mod = obj.modifiers.new("cut", "BOOLEAN")
    mod.operation = "DIFFERENCE"
    mod.solver = "EXACT"
    mod.operand_type = "COLLECTION"
    mod.collection = coll
    apply_modifiers(obj)
    for c in list(coll.objects):
        bpy.data.objects.remove(c)
    bpy.data.collections.remove(coll)


def shell(name, inset, mat):
    bm = base_bm()
    if inset:
        # uniform-ish inset: pull every vertex toward the centre along its direction
        for v in bm.verts:
            v.co -= v.co.normalized() * inset
    obj = new_object(name, bm, mat)
    boolean_cut(obj, facet_cutters_coll(name, inset))
    return obj


def facet_cutters_coll(name, inset):
    coll = cutter_collection(f"facets_{name}")
    facet_cutters(coll, inset)
    return coll


armor = shell("Armor", 0.0, M_ARMOR)
core = shell("Core", INSET, M_DARK)

# ray-cast targets follow the faceted forms
def bvh_of(obj):
    bm = bmesh.new()
    bm.from_mesh(obj.data)
    bm.transform(obj.matrix_world)
    tree = BVHTree.FromBMesh(bm)
    bm.free()
    return tree


BVH_ARMOR = bvh_of(armor)
BVH_CORE = bvh_of(core)


def surf(d, bvh=None, lift=0.0):
    bvh = bvh or BVH_ARMOR
    d = Vector(d).normalized()
    loc, nrm, _, _ = bvh.ray_cast(d * 5.0, -d)
    if loc is None:
        raise RuntimeError(f"ray missed for {tuple(d)}")
    return loc + nrm * lift, nrm


# --------------------------------------------------------------------------
# openings and panel gaps in the armour
# --------------------------------------------------------------------------

cuts = cutter_collection("openings")


def cbox(dims, loc, rot=(0, 0, 0)):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=Vector(dims), verts=bm.verts)
    m = Matrix.Translation(loc) @ Matrix.Rotation(rot[2], 4, "Z") @ Matrix.Rotation(rot[1], 4, "Y") @ Matrix.Rotation(rot[0], 4, "X")
    put_cutter(cuts, bm, m)


def ccyl(radius, depth, loc, rot=(0, 0, 0)):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=64, radius1=radius, radius2=radius, depth=depth)
    m = Matrix.Translation(loc) @ Matrix.Rotation(rot[2], 4, "Z") @ Matrix.Rotation(rot[1], 4, "Y") @ Matrix.Rotation(rot[0], 4, "X")
    put_cutter(cuts, bm, m)


for s in (-1, 1):
    cbox((0.64, 1.2, 0.18), (s * 0.3, -0.9, 0.05), (0, D(-s * 11), 0))      # V visor
    cbox((0.16, 1.2, 0.5), (s * 0.075, -0.9, -0.48), (0, D(s * 13), 0))     # muzzle V
    cbox((0.24, 1.2, 0.1), (s * 0.27, -0.9, 0.41), (0, D(-s * 9), 0))       # brow grilles
    cbox((0.2, 1.2, 0.07), (s * 0.5, -0.5, -0.22), (0, D(-s * 30), D(s * 40)))  # cheek vents
cbox((0.06, 1.2, 0.3), (0, -0.9, -0.12))                                     # nose slot
cbox((0.055, 1.2, 0.3), (0, -0.9, 0.44))                                     # forehead lamp
ccyl(0.2, 2.4, (0, 0.1, 0.02), (0, math.pi / 2, 0))                          # ear sockets
for k in range(3):
    cbox((0.44 - k * 0.06, 1.0, 0.032), (0, 0.95, 0.2 - k * 0.085))           # rear vents

G = 0.02
for s in (-1, 1):
    cbox((G, 2.6, 0.8), (s * 0.19, 0.25, 1.05))                                 # crest channels
    cbox((G, 1.2, 1.0), (s * 0.43, -0.62, -0.52), (0, D(-s * 26), D(s * 18)))   # cheek seams
    cbox((1.2, G, 0.55), (s * 0.58, -0.1, 0.44), (D(24), 0, 0))                # temple seams
    cbox((G, 1.4, 1.2), (s * 0.62, 0.55, -0.1), (0, D(s * 12), D(-s * 30)))     # rear diagonals
cbox((2.4, 1.3, G), (0, 0.75, -0.14))                                            # rear skull seam
cbox((2.4, G, 1.1), (0, 0.4, -0.56))                                             # behind-ear seam
cbox((2.4, G, 0.7), (0, 0.15, 1.02))                                             # crown seam
cbox((1.7, 1.2, G), (0, -0.75, 0.3))                                             # brow seam
cbox((1.7, 1.2, G), (0, -0.6, -0.76), (D(18), 0, 0))                             # jaw seam

boolean_cut(armor, cuts)
bevel(armor, width=0.008, segments=3, angle=12)
shade(armor)
bevel(core, width=0.006, segments=2, angle=12)
shade(core)


# --------------------------------------------------------------------------
# parts
# --------------------------------------------------------------------------

parts = []


def add(obj, bev=None):
    if bev:
        bevel(obj, *bev)
    shade(obj)
    parts.append(obj)
    return obj


def placed(name, bm, mat, m, bev=None):
    bmesh.ops.transform(bm, matrix=m, verts=bm.verts)
    return add(new_object(name, bm, mat), bev)


def cyl(r1, r2, depth, seg=48, z=0.0):
    bm = bmesh.new()
    bmesh.ops.create_cone(bm, cap_ends=True, segments=seg, radius1=r1, radius2=r2, depth=depth)
    bmesh.ops.translate(bm, vec=(0, 0, z + depth / 2), verts=bm.verts)
    return bm


def box(dx, dy, dz, z=0.0, x=0.0, y=0.0):
    bm = bmesh.new()
    bmesh.ops.create_cube(bm, size=1.0)
    bmesh.ops.scale(bm, vec=(dx, dy, dz), verts=bm.verts)
    bmesh.ops.translate(bm, vec=(x, y, z + dz / 2), verts=bm.verts)
    return bm


def torus(R, r, seg=64, ring=12):
    bm = bmesh.new()
    verts = []
    for i in range(seg):
        a = 2 * math.pi * i / seg
        for j in range(ring):
            b = 2 * math.pi * j / ring
            verts.append(bm.verts.new(((R + r * math.cos(b)) * math.cos(a), (R + r * math.cos(b)) * math.sin(a), r * math.sin(b))))
    for i in range(seg):
        for j in range(ring):
            bm.faces.new((verts[i * ring + j], verts[((i + 1) % seg) * ring + j], verts[((i + 1) % seg) * ring + (j + 1) % ring], verts[i * ring + (j + 1) % ring]))
    return bm


def sweep(name, dirs, width, height, mat, bvh=None, lift=0.0, bev=(0.004, 2, 40)):
    """Rectangular rib that follows the surface through a list of directions."""
    pts = [surf(d, bvh, lift) for d in dirs]
    bm = bmesh.new()
    rings = []
    for i, (p, n) in enumerate(pts):
        a = pts[max(i - 1, 0)][0]
        b = pts[min(i + 1, len(pts) - 1)][0]
        t = (b - a).normalized()
        side = n.cross(t).normalized()
        up = t.cross(side).normalized()
        rings.append([bm.verts.new(p + side * (sx * width / 2) + up * (sy * height - 0.25 * height)) for sx, sy in ((-1, 0), (1, 0), (1, 1), (-1, 1))])
    for i in range(len(rings) - 1):
        for k in range(4):
            bm.faces.new((rings[i][k], rings[i][(k + 1) % 4], rings[i + 1][(k + 1) % 4], rings[i + 1][k]))
    bm.faces.new(rings[0][::-1])
    bm.faces.new(rings[-1])
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return add(new_object(name, bm, mat), bev)


def plate(name, az_bottom, az_top, el0, el1, mat, thick=0.018, lift=0.002, res=(14, 10), bvh=None, bev=(0.008, 3, 30)):
    """Raised armour tile projected onto the surface. az ranges may differ top/bottom (trapezoids)."""
    nu, nv = res
    bm = bmesh.new()
    top, bot = [], []
    for j in range(nv + 1):
        fv = j / nv
        a0 = az_bottom[0] + (az_top[0] - az_bottom[0]) * fv
        a1 = az_bottom[1] + (az_top[1] - az_bottom[1]) * fv
        el = el0 + (el1 - el0) * fv
        rt, rb = [], []
        for i in range(nu + 1):
            p, n = surf(sph(a0 + (a1 - a0) * i / nu, el), bvh, 0.0)
            rt.append(bm.verts.new(p + n * (lift + thick)))
            rb.append(bm.verts.new(p + n * lift))
        top.append(rt)
        bot.append(rb)
    for j in range(nv):
        for i in range(nu):
            bm.faces.new((top[j][i], top[j][i + 1], top[j + 1][i + 1], top[j + 1][i]))
            bm.faces.new((bot[j][i], bot[j + 1][i], bot[j + 1][i + 1], bot[j][i + 1]))
    ring_t = [top[0][i] for i in range(nu + 1)] + [top[j][nu] for j in range(1, nv + 1)] + [top[nv][i] for i in range(nu - 1, -1, -1)] + [top[j][0] for j in range(nv - 1, 0, -1)]
    ring_b = [bot[0][i] for i in range(nu + 1)] + [bot[j][nu] for j in range(1, nv + 1)] + [bot[nv][i] for i in range(nu - 1, -1, -1)] + [bot[j][0] for j in range(nv - 1, 0, -1)]
    for k in range(len(ring_t)):
        k2 = (k + 1) % len(ring_t)
        bm.faces.new((ring_t[k], ring_b[k], ring_b[k2], ring_t[k2]))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    return add(new_object(name, bm, mat), bev)


def patch(name, az0, az1, el0, el1, mat, bvh, lift, res=12, uv_scale=4.0):
    bm = bmesh.new()
    uv = bm.loops.layers.uv.new("UVMap")
    grid = []
    for j in range(res + 1):
        grid.append([bm.verts.new(surf(sph(az0 + (az1 - az0) * i / res, el0 + (el1 - el0) * j / res), bvh, lift)[0]) for i in range(res + 1)])
    for j in range(res):
        for i in range(res):
            f = bm.faces.new((grid[j][i], grid[j][i + 1], grid[j + 1][i + 1], grid[j + 1][i]))
            for loop, (u, v) in zip(f.loops, ((i, j), (i + 1, j), (i + 1, j + 1), (i, j + 1))):
                loop[uv].uv = (u / res * uv_scale, v / res * uv_scale * abs(el1 - el0) / max(1e-3, abs(az1 - az0)))
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    obj = new_object(name, bm, mat)
    shade(obj)
    parts.append(obj)
    return obj


def lens(d, radius, bvh=None, depth=0.075):
    p, n = surf(d, bvh or BVH_CORE)
    m = frame(p - n * 0.015, n)
    placed("lens_housing", cyl(radius * 1.38, radius * 1.2, depth), M_GUN, m, (0.006, 2, 30))
    placed("lens_bezel", torus(radius * 1.13, radius * 0.13), M_CHROME, m @ Matrix.Translation((0, 0, depth)))
    placed("lens_ring", torus(radius * 0.86, radius * 0.09, 72, 8), M_GLOW, m @ Matrix.Translation((0, 0, depth + 0.004)))
    placed("lens_glass", cyl(radius * 0.76, radius * 0.72, 0.012, 48), M_GLASS, m @ Matrix.Translation((0, 0, depth - 0.008)))
    placed("lens_pupil", cyl(radius * 0.2, radius * 0.16, 0.02, 24), M_GLOW, m @ Matrix.Translation((0, 0, depth - 0.004)))
    for k in range(12):
        a = 2 * math.pi * k / 12
        placed("lens_blade", box(radius * 0.07, radius * 0.3, 0.005, y=radius * 0.47), M_DARK, m @ Matrix.Translation((0, 0, depth + 0.004)) @ Matrix.Rotation(a, 4, "Z"))


# ---- eyes: main lenses + outer sensors in the visor, pods on the cranium
for s in (-1, 1):
    lens(sph(s * 20, 3.5), 0.078)
    lens(sph(s * 36, 8.5), 0.046)
    lens(sph(s * 32, 60), 0.048, BVH_ARMOR, 0.09)

# ---- neon seams inside the gaps (the "blue neon" read)
for s in (-1, 1):
    sweep("neon_crest", [Vector((s * 0.19, math.cos(D(a)), math.sin(D(a)) + 0.05)) for a in range(-40, 70, 3)], 0.008, 0.012, M_GLOW, BVH_CORE, 0.006, None)
    sweep("neon_visor", [sph(s * a, 11.5 + a * 0.19) for a in range(2, 44, 2)], 0.007, 0.008, M_GLOW, BVH_CORE, 0.004, None)
sweep("neon_brow", [sph(a, 17) for a in range(-40, 41, 3)], 0.006, 0.012, M_GLOW, BVH_CORE, 0.01, None)

# ---- nose bridge + forehead lamp
p, n = surf(sph(0, 5), BVH_CORE)
placed("bridge", box(0.08, 0.05, 0.075), M_CHROME, frame(p, n), (0.012, 3, 30))
p, n = surf(sph(0, 25), BVH_CORE)
placed("lamp", box(0.028, 0.24, 0.03), M_LAMP, frame(p, n, math.pi / 2), (0.008, 2, 30))

# ---- visor trims following the V band
for s in (-1, 1):
    sweep("brow_trim", [sph(s * a, 15.5 + a * 0.19) for a in range(3, 42, 2)], 0.028, 0.02, M_CHROME)
    sweep("cheek_trim", [sph(s * a, -4 + a * 0.19) for a in range(6, 40, 2)], 0.02, 0.016, M_GUN)
    # muzzle frame: rails running down the V to the chin
    sweep("muzzle_rail", [sph(s * (10 - (el + 14) * -0.12), el) for el in range(-14, -54, -3)], 0.03, 0.035, M_GUN, bev=(0.008, 2, 40))

# ---- crest
for s in (-1, 1):
    sweep("crest", [Vector((s * 0.26, math.cos(D(a)), math.sin(D(a)) + 0.05)) for a in range(-50, 62, 3)], 0.05, 0.028, M_ARMOR2, bev=(0.006, 2, 40))
sweep("crest_center", [Vector((0.0, -math.cos(D(a)), math.sin(D(a)))) for a in range(52, 150, 3)], 0.07, 0.055, M_ARMOR, bev=(0.014, 3, 40))

# ---- raised plates
for s in (-1, 1):
    def az(a, b):
        return tuple(sorted((s * a, s * b)))
    plate("cheek_plate", az(24, 50), az(30, 54), -30, -8, M_ARMOR)
    plate("jaw_plate", az(16, 34), az(22, 44), -60, -38, M_ARMOR2)
    plate("temple_plate", az(62, 88), az(58, 84), 22, 44, M_ARMOR2)
    plate("rear_plate", az(128, 160), az(132, 156), 8, 34, M_ARMOR)
    plate("rear_low", az(120, 150), az(125, 150), -40, -20, M_GUN)
    plate("crown_plate", az(40, 62), az(30, 48), 48, 66, M_ARMOR)
plate("forehead_plate", (-7, 7), (-10, 10), 31, 58, M_ARMOR2)
plate("occiput_plate", (165, 195), (168, 192), -8, 26, M_ARMOR2)

# ---- mouth: vents stepping down the muzzle V + chin guard
for k in range(9):
    el = -14 - k * 4.0
    p, n = surf(sph(0, el), BVH_CORE)
    w = 0.17 - k * 0.012
    placed("vent", box(w, 0.022, 0.04), M_CHROME if k % 2 else M_GUN, frame(p, n, math.pi / 2) @ Matrix.Rotation(math.pi / 2, 4, "Z"), (0.006, 2, 30))
p, n = surf(sph(0, -54))
placed("chin", box(0.2, 0.11, 0.09), M_ARMOR, frame(p - n * 0.03, n), (0.03, 4, 30))
placed("chin_light", box(0.09, 0.016, 0.012), M_GLOW, frame(p - n * 0.03, n) @ Matrix.Translation((0, 0, 0.09)))

# ---- grilles in the brow recesses and cheek vents
for s in (-1, 1):
    # perforated plate: gunmetal backing with a staggered field of dark holes
    a0, a1 = sorted((s * 11, s * 33))
    patch("brow_plate", a0, a1, 23.5, 31.5, M_GUN, BVH_CORE, 0.012, res=10, uv_scale=1)
    for row in range(3):
        for col in range(9):
            azh = s * (13 + col * 2.3 + (1.15 if row % 2 else 0))
            if abs(azh) > 32:
                continue
            p, n = surf(sph(azh, 25 + row * 2.4 + abs(azh) * 0.08), BVH_CORE, 0.014)
            placed("hole", cyl(0.011, 0.011, 0.004, 12), M_GLASS, frame(p, n))
    for k in range(3):
        sweep("cheek_louver", [sph(s * a, -15 + k * 2.4 + (a - 40) * 0.35) for a in range(40, 57, 2)], 0.009, 0.018, M_GUN, BVH_CORE, 0.004, None)

# ---- rear vents: louvers + a neon slit
for k in range(3):
    for s in (-1, 1):
        pass
    p, n = surf(sph(180, 11 - k * 4.8), BVH_CORE)
    placed("louver", box(0.36 - k * 0.05, 0.02, 0.03), M_GLOW if k == 1 else M_GUN, frame(p, n), (0.004, 2, 30) if k != 1 else None)

# ---- ear modules
for s in (-1, 1):
    p, n = surf(sph(s * 90, 2))
    m = frame(p - n * 0.05, n)
    placed("ear_base", cyl(0.25, 0.23, 0.11, 64), M_GUN, m, (0.008, 2, 30))
    placed("ear_ring", torus(0.215, 0.042, 96, 16), M_ARMOR, m @ Matrix.Translation((0, 0, 0.11)))
    placed("ear_glow", torus(0.158, 0.01, 96, 8), M_GLOW, m @ Matrix.Translation((0, 0, 0.125)))
    placed("ear_disc", cyl(0.14, 0.13, 0.03, 64), M_GLASS, m @ Matrix.Translation((0, 0, 0.11)))
    placed("ear_cap", cyl(0.07, 0.048, 0.085, 48), M_CHROME, m @ Matrix.Translation((0, 0, 0.11)), (0.01, 3, 30))
    for k in range(24):
        a = 2 * math.pi * k / 24
        placed("ear_fin", box(0.01, 0.055, 0.03), M_DARK, m @ Matrix.Translation((0, 0, 0.12)) @ Matrix.Rotation(a, 4, "Z") @ Matrix.Translation((0, 0.19, 0)))
    for k in range(6):
        a = 2 * math.pi * k / 6 + 0.3
        placed("ear_bolt", cyl(0.013, 0.013, 0.03, 16), M_CHROME, m @ Matrix.Translation((0, 0, 0.145)) @ Matrix.Rotation(a, 4, "Z") @ Matrix.Translation((0, 0.215, 0)))
    placed("ear_strut", box(0.05, 0.3, 0.04), M_GUN, m @ Matrix.Translation((0, -0.2, 0.05)) @ Matrix.Rotation(D(-20), 4, "X"), (0.01, 2, 30))

# ---- respirator canisters on the jaw
for s in (-1, 1):
    p, n = surf(sph(s * 44, -40))
    m = frame(p - n * 0.02, n)
    placed("resp_body", cyl(0.095, 0.085, 0.1, 48), M_GUN, m, (0.006, 2, 30))
    placed("resp_band", torus(0.093, 0.011, 64, 8), M_ACCENT, m @ Matrix.Translation((0, 0, 0.05)))
    placed("resp_face", cyl(0.066, 0.06, 0.02, 48), M_CHROME, m @ Matrix.Translation((0, 0, 0.1)))
    for k in range(16):
        a = 2 * math.pi * k / 16
        placed("resp_tooth", box(0.016, 0.028, 0.028), M_DARK, m @ Matrix.Translation((0, 0, 0.1)) @ Matrix.Rotation(a, 4, "Z") @ Matrix.Translation((0, 0.08, 0)))
    placed("resp_hub", cyl(0.024, 0.02, 0.03, 24), M_GLOW, m @ Matrix.Translation((0, 0, 0.12)))

# ---- greebles on exposed machinery
for s in (-1, 1):
    for el in (-18, -30, -42):
        p, n = surf(sph(s * 9.5, el), BVH_CORE)
        placed("piston", cyl(0.012, 0.012, 0.05, 16), M_CHROME, frame(p, n), None)
    p, n = surf(sph(s * 28, 3), BVH_CORE)
    placed("visor_block", box(0.03, 0.05, 0.03), M_CHROME, frame(p, n), (0.005, 2, 30))

# ---- decals and fasteners
for s in (-1, 1):
    for azd, el, kind in [
        (56, 32, "tri"), (66, 12, "bar"), (38, -34, "tri"), (22, -64, "bar"),
        (74, -22, "bolt"), (76, 30, "bolt"), (44, 66, "bolt"), (12, 66, "bar"),
        (58, -48, "bolt"), (84, 50, "tri"), (106, 26, "bar"), (118, 4, "bolt"),
        (140, 40, "tri"), (150, -8, "bar"), (26, 44, "bolt"), (60, -4, "bolt"),
    ]:
        try:
            p, n = surf(sph(s * azd, el), BVH_ARMOR, 0.0)
        except RuntimeError:
            continue
        m = frame(p, n, D(azd * s))
        if kind == "tri":
            bm = bmesh.new()
            h = 0.024
            v = [bm.verts.new(c) for c in ((0, h, 0), (-h * 0.9, -h * 0.6, 0), (h * 0.9, -h * 0.6, 0), (0, h, 0.005), (-h * 0.9, -h * 0.6, 0.005), (h * 0.9, -h * 0.6, 0.005))]
            for f in ((0, 1, 2), (5, 4, 3), (0, 3, 4, 1), (1, 4, 5, 2), (2, 5, 3, 0)):
                bm.faces.new([v[i] for i in f])
            bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
            placed("decal", bm, M_ACCENT, m)
        elif kind == "bar":
            placed("decal", box(0.065, 0.014, 0.005), M_ACCENT, m)
            placed("decal", box(0.018, 0.014, 0.005, x=0.05), M_DARK, m)
        else:
            placed("bolt", cyl(0.016, 0.013, 0.012, 20), M_CHROME, m, (0.003, 2, 30))

# ---- neck and collar
add(new_object("neck", cyl(0.36, 0.34, 0.75, 64, z=-1.62), M_DARK))
for k in range(6):
    placed("neck_rib", torus(0.345 - k * 0.002, 0.016, 64, 10), M_GUN if k % 2 else M_CHROME, Matrix.Translation((0, 0.05, -1.0 - k * 0.1)))
# cable spine running up the back of the neck
for k in range(-2, 3):
    placed("neck_cable", cyl(0.028, 0.028, 0.75, 16, z=0), M_HOSE if k else M_CHROME, Matrix.Translation((k * 0.075, 0.34, -1.62)))

for s in (-1, 1):
    pts = [Vector((s * 0.4, -0.42, -0.74)), Vector((s * 0.48, -0.3, -0.98)), Vector((s * 0.42, -0.2, -1.22)), Vector((s * 0.36, -0.05, -1.46))]
    curve = bpy.data.curves.new("hose", "CURVE")
    curve.dimensions = "3D"
    spl = curve.splines.new("BEZIER")
    spl.bezier_points.add(len(pts) - 1)
    for bp, co in zip(spl.bezier_points, pts):
        bp.co = co
        bp.handle_left_type = bp.handle_right_type = "AUTO"
    curve.bevel_depth = 0.04
    curve.bevel_resolution = 4
    curve.resolution_u = 24
    cobj = bpy.data.objects.new("hose", curve)
    scene.collection.objects.link(cobj)
    dg = bpy.context.evaluated_depsgraph_get()
    me = bpy.data.meshes.new_from_object(cobj.evaluated_get(dg))
    bpy.data.objects.remove(cobj)
    hose = bpy.data.objects.new("hose", me)
    scene.collection.objects.link(hose)
    me.materials.append(M_HOSE)
    add(hose)
    samples = []
    for i in range(len(pts) - 1):
        samples += [pts[i].lerp(pts[i + 1], t / 10) for t in range(10)]
    for i in range(1, len(samples) - 1):
        d = (samples[i + 1] - samples[i - 1]).normalized()
        placed("hose_rib", torus(0.042, 0.009, 32, 6), M_HOSE, frame(samples[i], d))

# ---- silhouette breakers: dorsal fins and flared cheek guards
for s in (-1, 1):
    sweep("fin", [sph(s * a, 46 - (a - 96) * 0.3) for a in range(96, 170, 3)], 0.035, 0.13, M_ARMOR2, bev=(0.01, 3, 40))
    sweep("fin_neon", [sph(s * a, 46 - (a - 96) * 0.3) for a in range(100, 150, 3)], 0.037, 0.012, M_GLOW, lift=0.06, bev=None)
    az0, az1 = sorted((s * 54, s * 80))
    az2, az3 = sorted((s * 50, s * 72))
    plate("cheek_guard", (az0, az1), (az2, az3), -42, -14, M_ARMOR, thick=0.05, lift=0.02)

# --------------------------------------------------------------------------
# merge + export
# --------------------------------------------------------------------------

for obj in list(scene.objects):
    obj.select_set(obj.type == "MESH")
bpy.context.view_layer.objects.active = armor
bpy.ops.object.join()
helmet = bpy.context.view_layer.objects.active
helmet.name = "Helmet"

tris = sum(len(p.vertices) - 2 for p in helmet.data.polygons)
print(f"HELMET_TRIS {tris}")

os.makedirs(os.path.dirname(OUT_GLB), exist_ok=True)
bpy.ops.export_scene.gltf(
    filepath=OUT_GLB,
    export_format="GLB",
    use_selection=True,
    export_apply=True,
    export_yup=True,
    export_draco_mesh_compression_enable=True,
    export_draco_mesh_compression_level=7,
    export_draco_position_quantization=16,
    export_draco_normal_quantization=12,
)
print(f"EXPORTED {OUT_GLB} {os.path.getsize(OUT_GLB)}")


# --------------------------------------------------------------------------
# preview renders
# --------------------------------------------------------------------------

if OUT_PREVIEW:
    world = bpy.data.worlds.new("World")
    scene.world = world
    world.use_nodes = True
    wn = world.node_tree
    bg = wn.nodes.get("Background")
    if HDRI and os.path.exists(HDRI):
        env = wn.nodes.new("ShaderNodeTexEnvironment")
        env.image = bpy.data.images.load(HDRI)
        wn.links.new(env.outputs["Color"], bg.inputs["Color"])
    bg.inputs["Strength"].default_value = 0.8
    lp = wn.nodes.new("ShaderNodeLightPath")
    dark = wn.nodes.new("ShaderNodeBackground")
    dark.inputs["Color"].default_value = (0.012, 0.014, 0.02, 1)
    mix = wn.nodes.new("ShaderNodeMixShader")
    out = wn.nodes.get("World Output")
    wn.links.new(lp.outputs["Is Camera Ray"], mix.inputs[0])
    wn.links.new(bg.outputs[0], mix.inputs[1])
    wn.links.new(dark.outputs[0], mix.inputs[2])
    wn.links.new(mix.outputs[0], out.inputs["Surface"])

    def light(name, loc, energy, color, size):
        ld = bpy.data.lights.new(name, "AREA")
        ld.energy = energy
        ld.color = color
        ld.size = size
        lo = bpy.data.objects.new(name, ld)
        lo.location = loc
        lo.rotation_euler = (-Vector(loc)).to_track_quat("-Z", "Y").to_euler()
        scene.collection.objects.link(lo)

    light("key", (-2.5, -3.2, 2.6), 500, (1.0, 0.96, 0.9), 2.0)
    light("rim_l", (-2.8, 2.5, 1.0), 380, (0.3, 0.8, 1.0), 1.5)
    light("rim_r", (2.8, 2.2, 0.6), 380, (0.3, 0.8, 1.0), 1.5)

    cam_data = bpy.data.cameras.new("cam")
    cam_data.lens = 85
    cam = bpy.data.objects.new("cam", cam_data)
    scene.collection.objects.link(cam)
    scene.camera = cam

    scene.render.engine = "CYCLES"
    scene.cycles.samples = 64
    scene.cycles.use_denoising = True
    scene.render.resolution_x = 900
    scene.render.resolution_y = 900
    scene.view_settings.view_transform = "AgX"
    try:
        scene.view_settings.look = "AgX - Punchy"
    except TypeError:
        pass

    for tag, (az_deg, el_deg) in {"front": (14, 2), "three_quarter": (48, 6)}.items():
        dist = 7.2
        target = Vector((0, 0.05, -0.35))
        cam.location = target + sph(az_deg, el_deg) * dist
        cam.rotation_euler = (target - cam.location).to_track_quat("-Z", "Y").to_euler()
        scene.render.filepath = f"{OUT_PREVIEW}_{tag}.png"
        bpy.ops.render.render(write_still=True)
        print(f"RENDERED {scene.render.filepath}")
