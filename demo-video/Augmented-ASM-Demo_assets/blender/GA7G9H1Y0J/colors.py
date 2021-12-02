# OpenShot Video Editor is a program that creates, modifies, and edits video files.
#   Copyright (C) 2009  Jonathan Thomas
#
# This file is part of OpenShot Video Editor (http://launchpad.net/openshot/).
#
# OpenShot Video Editor is free software: you can redistribute it and/or modify
# it under the terms of the GNU General Public License as published by
# the Free Software Foundation, either version 3 of the License, or
# (at your option) any later version.
#
# OpenShot Video Editor is distributed in the hope that it will be useful,
# but WITHOUT ANY WARRANTY; without even the implied warranty of
# MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
# GNU General Public License for more details.
#
# You should have received a copy of the GNU General Public License
# along with OpenShot Video Editor.  If not, see <http://www.gnu.org/licenses/>.


# Import Blender's python API.  This only works when the script is being
# run from the context of Blender.  Blender contains it's own version of Python
# with this library pre-installed.
import bpy


def load_font(font_path):
    """ Load a new TTF font into Blender, and return the font object """
    # get the original list of fonts (before we add a new one)
    original_fonts = bpy.data.fonts.keys()

    # load new font
    bpy.ops.font.open(filepath=font_path)

    # get the new list of fonts (after we added a new one)
    for font_name in bpy.data.fonts.keys():
        if font_name not in original_fonts:
            return bpy.data.fonts[font_name]

    # no new font was added
    return None

# Debug Info:
# ./blender -b test.blend -P demo.py
# -b = background mode
# -P = run a Python script within the context of the project file


# Init all of the variables needed by this script.  Because Blender executes
# this script, OpenShot will inject a dictionary of the required parameters
# before this script is executed.
params = {
    'title': 'Oh Yeah! OpenShot!',
    'extrude': 0.1,
    'bevel_depth': 0.02,
    'spacemode': 'CENTER',
    'text_size': 1.5,
    'width': 1.0,
    'fontname': 'Bfont',

    'color': [0.8, 0.8, 0.8],
    'alpha': 1.0,

    'output_path': '/tmp/',
    'fps': 24,
    'quality': 90,
    'file_format': 'PNG',
    'color_mode': 'RGBA',
    'horizon_color': [0.57, 0.57, 0.57],
    'resolution_x': 1920,
    'resolution_y': 1080,
    'resolution_percentage': 100,
    'start_frame': 20,
    'end_frame': 25,
    'animation': True,
}


#BEGIN INJECTING PARAMS
params['file_name'] = u'TitleFileName'
params['title1'] = u'Title 1'
params['title2'] = u'Title 2'
params['title3'] = u'Title 3'
params['extrude'] = 0.1
params['bevel_depth'] = 0.02
params['fontname'] = u'Bfont'
params['text_size'] = 1.0
params['width'] = 1.0
params['diffuse_color'] = [1.0, 1.0, 1.0, 1.0]
params['specular_color'] = [1.0, 1.0, 1.0]
params['specular_intensity'] = 0.5
params['specular_color_bg'] = [1.0, 1.0, 1.0]
params['specular_intensity_bg'] = 0.5
params['shadeless'] = u'No'
params['diffuse_color_t1'] = [0.0, 0.5450980392156862, 0.9058823529411765, 1.0]
params['diffuse_color_t2'] = [0.9058823529411765, 0.0, 0.7529411764705882, 1.0]
params['diffuse_color_t3'] = [0.9529411764705882, 0.6784313725490196, 0.0, 1.0]
params['diffuse_color_t4'] = [0.0, 0.0, 0.0, 1.0]
params['start_frame'] = 1
params['end_frame'] = 300
params['animation_speed'] = u'1'
params['resolution_x'] = 1280
params['resolution_y'] = 720
params['resolution_percentage'] = 50
params['quality'] = 100
params['file_format'] = u'PNG'
params['color_mode'] = u'RGBA'
params['alpha_mode'] = 1
params['animation'] = True
params['output_path'] = u'C:\\Users\\edw19b\\.openshot_qt\\blender\\GA7G9H1Y0J\\TitleFileName'
#END INJECTING PARAMS

#ONLY RENDER 1 FRAME FOR PREVIEW
params['start_frame'] = 150
params['end_frame'] = 150
#END ONLY RENDER 1 FRAME FOR PREVIEW


# The remainder of this script will modify the current Blender .blend project
# file, and adjust the settings.  The .blend file is specified in the XML file
# that defines this template in OpenShot.
# ----------------------------------------------------------------------------

# TITLE 1 - Modify Text / Curve settings
text_object1 = bpy.data.curves["Title1"]
text_object1.extrude = params["extrude"]
text_object1.bevel_depth = params["bevel_depth"]
text_object1.body = params["title1"]
text_object1.align_x = params["spacemode"]
text_object1.size = params["text_size"]
text_object1.space_character = params["width"]
# Get font object
font = None
if params["fontname"] != "Bfont":
    # Add font so it's available to Blender
    font = load_font(params["fontname"])
else:
    # Get default font
    font = bpy.data.fonts["Bfont"]
text_object1.font = font

# TITLE 2 - Modify Text / Curve settings
text_object2 = bpy.data.curves["Title2"]
text_object2.extrude = params["extrude"]
text_object2.bevel_depth = params["bevel_depth"]
text_object2.body = params["title2"]
text_object2.align_x = params["spacemode"]
text_object2.size = params["text_size"]
text_object2.space_character = params["width"]
text_object2.font = font

# TITLE 3 - Modify Text / Curve settings
text_object3 = bpy.data.curves["Title3"]
text_object3.extrude = params["extrude"]
text_object3.bevel_depth = params["bevel_depth"]
text_object3.body = params["title3"]
text_object3.align_x = params["spacemode"]
text_object3.size = params["text_size"]
text_object3.space_character = params["width"]
text_object3.font = font

# TITLE 1 - Change the material settings (color, alpha, etc...)
material_object1 = bpy.data.materials["Title1.Material"]
material_object1.diffuse_color = params["diffuse_color"]
material_object1.specular_color = params["specular_color"]
material_object1.specular_intensity = params["specular_intensity"]

# TITLE 2 - Change the material settings (color, alpha, etc...)
material_object2 = bpy.data.materials["Title2.Material"]
material_object2.diffuse_color = params["diffuse_color"]
material_object2.specular_color = params["specular_color"]
material_object2.specular_intensity = params["specular_intensity"]

# TITLE 3 - Change the material settings (color, alpha, etc...)
material_object3 = bpy.data.materials["Title3.Material"]
material_object3.diffuse_color = params["diffuse_color"]
material_object3.specular_color = params["specular_color"]
material_object3.specular_intensity = params["specular_intensity"]

# BACKGROUND - Change the material settings (color, alpha, etc...)
material_object4 = bpy.data.materials["Background.Material"]
material_object4.specular_color = params["specular_color_bg"]
material_object4.specular_intensity = params["specular_intensity_bg"]

# Shadeless Background
# TODO: Unsupported in Blender 2.8 (not sure of workaround yet)
# if params["shadeless"] == "Yes":
# material_object4.use_shadeless = True
# else:
# material_object4.use_shadeless = False

# BACKGROUND COLORS (KEYFRAMES) ----------------------
# TILE 1
bpy.data.actions["Background.MaterialAc"].fcurves[0].keyframe_points[0].co = (1.0, params["diffuse_color_t1"][0])
bpy.data.actions["Background.MaterialAc"].fcurves[0].keyframe_points[0].handle_left.y = params["diffuse_color_t1"][0]
bpy.data.actions["Background.MaterialAc"].fcurves[0].keyframe_points[0].handle_right.y = params["diffuse_color_t1"][0]

bpy.data.actions["Background.MaterialAc"].fcurves[1].keyframe_points[0].co = (1.0, params["diffuse_color_t1"][1])
bpy.data.actions["Background.MaterialAc"].fcurves[1].keyframe_points[0].handle_left.y = params["diffuse_color_t1"][1]
bpy.data.actions["Background.MaterialAc"].fcurves[1].keyframe_points[0].handle_right.y = params["diffuse_color_t1"][1]

bpy.data.actions["Background.MaterialAc"].fcurves[2].keyframe_points[0].co = (1.0, params["diffuse_color_t1"][2])
bpy.data.actions["Background.MaterialAc"].fcurves[2].keyframe_points[0].handle_left.y = params["diffuse_color_t1"][2]
bpy.data.actions["Background.MaterialAc"].fcurves[2].keyframe_points[0].handle_right.y = params["diffuse_color_t1"][2]

bpy.data.actions["Background.MaterialAc"].fcurves[0].keyframe_points[1].co = (70.0, params["diffuse_color_t1"][0])
bpy.data.actions["Background.MaterialAc"].fcurves[0].keyframe_points[1].handle_left.y = params["diffuse_color_t1"][0]
bpy.data.actions["Background.MaterialAc"].fcurves[0].keyframe_points[1].handle_right.y = params["diffuse_color_t1"][0]

bpy.data.actions["Background.MaterialAc"].fcurves[1].keyframe_points[1].co = (70.0, params["diffuse_color_t1"][1])
bpy.data.actions["Background.MaterialAc"].fcurves[1].keyframe_points[1].handle_left.y = params["diffuse_color_t1"][1]
bpy.data.actions["Background.MaterialAc"].fcurves[1].keyframe_points[1].handle_right.y = params["diffuse_color_t1"][1]

bpy.data.actions["Background.MaterialAc"].fcurves[2].keyframe_points[1].co = (70.0, params["diffuse_color_t1"][2])
bpy.data.actions["Background.MaterialAc"].fcurves[2].keyframe_points[1].handle_left.y = params["diffuse_color_t1"][2]
bpy.data.actions["Background.MaterialAc"].fcurves[2].keyframe_points[1].handle_right.y = params["diffuse_color_t1"][2]

# TILE 2
bpy.data.actions["Background.MaterialAc"].fcurves[0].keyframe_points[2].co = (120.0, params["diffuse_color_t2"][0])
bpy.data.actions["Background.MaterialAc"].fcurves[0].keyframe_points[2].handle_left.y = params["diffuse_color_t2"][0]
bpy.data.actions["Background.MaterialAc"].fcurves[0].keyframe_points[2].handle_right.y = params["diffuse_color_t2"][0]

bpy.data.actions["Background.MaterialAc"].fcurves[1].keyframe_points[2].co = (120.0, params["diffuse_color_t2"][1])
bpy.data.actions["Background.MaterialAc"].fcurves[1].keyframe_points[2].handle_left.y = params["diffuse_color_t2"][1]
bpy.data.actions["Background.MaterialAc"].fcurves[1].keyframe_points[2].handle_right.y = params["diffuse_color_t2"][1]

bpy.data.actions["Background.MaterialAc"].fcurves[2].keyframe_points[2].co = (120.0, params["diffuse_color_t2"][2])
bpy.data.actions["Background.MaterialAc"].fcurves[2].keyframe_points[2].handle_left.y = params["diffuse_color_t2"][2]
bpy.data.actions["Background.MaterialAc"].fcurves[2].keyframe_points[2].handle_right.y = params["diffuse_color_t2"][2]

bpy.data.actions["Background.MaterialAc"].fcurves[0].keyframe_points[3].co = (160.0, params["diffuse_color_t2"][0])
bpy.data.actions["Background.MaterialAc"].fcurves[0].keyframe_points[3].handle_left.y = params["diffuse_color_t2"][0]
bpy.data.actions["Background.MaterialAc"].fcurves[0].keyframe_points[3].handle_right.y = params["diffuse_color_t2"][0]

bpy.data.actions["Background.MaterialAc"].fcurves[1].keyframe_points[3].co = (160.0, params["diffuse_color_t2"][1])
bpy.data.actions["Background.MaterialAc"].fcurves[1].keyframe_points[3].handle_left.y = params["diffuse_color_t2"][1]
bpy.data.actions["Background.MaterialAc"].fcurves[1].keyframe_points[3].handle_right.y = params["diffuse_color_t2"][1]

bpy.data.actions["Background.MaterialAc"].fcurves[2].keyframe_points[3].co = (160.0, params["diffuse_color_t2"][2])
bpy.data.actions["Background.MaterialAc"].fcurves[2].keyframe_points[3].handle_left.y = params["diffuse_color_t2"][2]
bpy.data.actions["Background.MaterialAc"].fcurves[2].keyframe_points[3].handle_right.y = params["diffuse_color_t2"][2]

# TILE 3
bpy.data.actions["Background.MaterialAc"].fcurves[0].keyframe_points[4].co = (200.0, params["diffuse_color_t3"][0])
bpy.data.actions["Background.MaterialAc"].fcurves[0].keyframe_points[4].handle_left.y = params["diffuse_color_t3"][0]
bpy.data.actions["Background.MaterialAc"].fcurves[0].keyframe_points[4].handle_right.y = params["diffuse_color_t3"][0]

bpy.data.actions["Background.MaterialAc"].fcurves[1].keyframe_points[4].co = (200.0, params["diffuse_color_t3"][1])
bpy.data.actions["Background.MaterialAc"].fcurves[1].keyframe_points[4].handle_left.y = params["diffuse_color_t3"][1]
bpy.data.actions["Background.MaterialAc"].fcurves[1].keyframe_points[4].handle_right.y = params["diffuse_color_t3"][1]

bpy.data.actions["Background.MaterialAc"].fcurves[2].keyframe_points[4].co = (200.0, params["diffuse_color_t3"][2])
bpy.data.actions["Background.MaterialAc"].fcurves[2].keyframe_points[4].handle_left.y = params["diffuse_color_t3"][2]
bpy.data.actions["Background.MaterialAc"].fcurves[2].keyframe_points[4].handle_right.y = params["diffuse_color_t3"][2]

bpy.data.actions["Background.MaterialAc"].fcurves[0].keyframe_points[5].co = (240.0, params["diffuse_color_t3"][0])
bpy.data.actions["Background.MaterialAc"].fcurves[0].keyframe_points[5].handle_left.y = params["diffuse_color_t3"][0]
bpy.data.actions["Background.MaterialAc"].fcurves[0].keyframe_points[5].handle_right.y = params["diffuse_color_t3"][0]

bpy.data.actions["Background.MaterialAc"].fcurves[1].keyframe_points[5].co = (240.0, params["diffuse_color_t3"][1])
bpy.data.actions["Background.MaterialAc"].fcurves[1].keyframe_points[5].handle_left.y = params["diffuse_color_t3"][1]
bpy.data.actions["Background.MaterialAc"].fcurves[1].keyframe_points[5].handle_right.y = params["diffuse_color_t3"][1]

bpy.data.actions["Background.MaterialAc"].fcurves[2].keyframe_points[5].co = (240.0, params["diffuse_color_t3"][2])
bpy.data.actions["Background.MaterialAc"].fcurves[2].keyframe_points[5].handle_left.y = params["diffuse_color_t3"][2]
bpy.data.actions["Background.MaterialAc"].fcurves[2].keyframe_points[5].handle_right.y = params["diffuse_color_t3"][2]

# TILE 4
bpy.data.actions["Background.MaterialAc"].fcurves[0].keyframe_points[6].co = (300.0, params["diffuse_color_t4"][0])
bpy.data.actions["Background.MaterialAc"].fcurves[0].keyframe_points[6].handle_left.y = params["diffuse_color_t4"][0]
bpy.data.actions["Background.MaterialAc"].fcurves[0].keyframe_points[6].handle_right.y = params["diffuse_color_t4"][0]

bpy.data.actions["Background.MaterialAc"].fcurves[1].keyframe_points[6].co = (300.0, params["diffuse_color_t4"][1])
bpy.data.actions["Background.MaterialAc"].fcurves[1].keyframe_points[6].handle_left.y = params["diffuse_color_t4"][1]
bpy.data.actions["Background.MaterialAc"].fcurves[1].keyframe_points[6].handle_right.y = params["diffuse_color_t4"][1]

bpy.data.actions["Background.MaterialAc"].fcurves[2].keyframe_points[6].co = (300.0, params["diffuse_color_t4"][2])
bpy.data.actions["Background.MaterialAc"].fcurves[2].keyframe_points[6].handle_left.y = params["diffuse_color_t4"][2]
bpy.data.actions["Background.MaterialAc"].fcurves[2].keyframe_points[6].handle_right.y = params["diffuse_color_t4"][2]


# Set the render options.  It is important that these are set
# to the same values as the current OpenShot project.  These
# params are automatically set by OpenShot
bpy.context.scene.render.filepath = params["output_path"]
bpy.context.scene.render.fps = params["fps"]
bpy.context.scene.render.image_settings.file_format = params["file_format"]
bpy.context.scene.render.image_settings.color_mode = params["color_mode"]
bpy.context.scene.render.film_transparent = params["alpha_mode"]
bpy.data.worlds[0].color = params["horizon_color"]
bpy.context.scene.render.resolution_x = params["resolution_x"]
bpy.context.scene.render.resolution_y = params["resolution_y"]
bpy.context.scene.render.resolution_percentage = params["resolution_percentage"]
bpy.context.scene.frame_start = params["start_frame"]
bpy.context.scene.frame_end = params["end_frame"]

# Animation Speed (use Blender's time remapping to slow or speed up animation)
animation_speed = int(params["animation_speed"])  # time remapping multiplier
new_length = int(params["end_frame"]) * animation_speed  # new length (in frames)
bpy.context.scene.frame_end = new_length
bpy.context.scene.render.frame_map_old = 1
bpy.context.scene.render.frame_map_new = animation_speed
if params["start_frame"] == params["end_frame"]:
    bpy.context.scene.frame_start = params["end_frame"]
    bpy.context.scene.frame_end = params["end_frame"]

# Render the current animation to the params["output_path"] folder
bpy.ops.render.render(animation=params["animation"])
